package internal

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/google/uuid"
)

// batchActionHandler 批量操作处理函数
type batchActionHandler func(panels map[string][]LinkCategory, payload json.RawMessage) error

// batchActionHandlers 批量操作分发表
var batchActionHandlers = map[string]batchActionHandler{
	"CREATE_LINKS":       applyCreateLinks,
	"DELETE_LINKS":       applyDeleteLinks,
	"UPDATE_LINKS":       applyUpdateLinks,
	"MOVE_LINKS":         applyMoveLinks,
	"DELETE_CATEGORIES":  applyDeleteCategories,
	"REORDER_CATEGORIES": applyReorderCategories,
}

// HandleLinksBatch 处理链接批量事务操作
func HandleLinksBatch(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondWithError(w, http.StatusMethodNotAllowed, "Invalid request method")
		return
	}

	var actions []BatchAction
	if err := json.NewDecoder(r.Body).Decode(&actions); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid actions format: "+err.Error())
		return
	}

	panels := LoadLinks()

	for _, action := range actions {
		handler, ok := batchActionHandlers[action.Action]
		if !ok {
			respondWithError(w, http.StatusBadRequest, "Unknown action: "+action.Action)
			return
		}
		if err := handler(panels, action.Payload); err != nil {
			respondWithError(w, http.StatusBadRequest, err.Error())
			return
		}
	}

	filterEmptyCategories(panels)

	if err := SaveLinks(panels); err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to save links after batch update: "+err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]string{"message": "Batch update successful"})
}

// filterEmptyCategories 过滤空分类
func filterEmptyCategories(panels map[string][]LinkCategory) {
	for panelKey, categories := range panels {
		var filteredCategories []LinkCategory
	for _, category := range categories {
		if len(category.Links) > 0 { filteredCategories = append(filteredCategories, category) }
	}
		panels[panelKey] = filteredCategories
	}
}

// findOrCreateCategory 查找分类，不存在则创建
func findOrCreateCategory(categories *[]LinkCategory, categoryName string) *LinkCategory {
	for i := range *categories {
		if (*categories)[i].Name == categoryName { return &(*categories)[i] }
	}

	newCategory := LinkCategory{Name: categoryName, Links: []Link{}}
	*categories = append(*categories, newCategory)
	return &(*categories)[len(*categories)-1]
}

// applyCreateLinks 创建链接
func applyCreateLinks(panels map[string][]LinkCategory, payload json.RawMessage) error {
	var p CreateLinksPayload
	if err := json.Unmarshal(payload, &p); err != nil {
		return fmt.Errorf("Invalid CREATE_LINKS payload: %w", err)
	}
	if p.Category == "" {
		p.Category = "Uncategorized"
	}

	targetPanel, ok := panels[p.Panel]
	if !ok {
		targetPanel = []LinkCategory{}
	}

	targetCategory := findOrCreateCategory(&targetPanel, p.Category)

	maxSort := -1
	for _, link := range targetCategory.Links {
		if link.Sort > maxSort { maxSort = link.Sort }
	}

	for _, newLink := range p.Links {
		maxSort++
		newLink.ID = uuid.NewString()
		newLink.Sort = maxSort
		targetCategory.Links = append(targetCategory.Links, newLink)
	}
	panels[p.Panel] = targetPanel
	return nil
}

// applyDeleteLinks 删除链接
func applyDeleteLinks(panels map[string][]LinkCategory, payload json.RawMessage) error {
	var p DeleteLinksPayload
	if err := json.Unmarshal(payload, &p); err != nil {
		return fmt.Errorf("Invalid DELETE_LINKS payload: %w", err)
	}
	idsToDelete := make(map[string]struct{})
	for _, id := range p.IDs {
		idsToDelete[id] = struct{}{}
	}

	for panelKey, categories := range panels {
		for i := range categories {
			var remainingLinks []Link
	for _, link := range categories[i].Links {
		if _, found := idsToDelete[link.ID]; !found { remainingLinks = append(remainingLinks, link) }
	}
			panels[panelKey][i].Links = remainingLinks
		}
	}
	return nil
}

// applyUpdateLinks 更新链接
func applyUpdateLinks(panels map[string][]LinkCategory, payload json.RawMessage) error {
	var items []UpdateLinkItem
	if err := json.Unmarshal(payload, &items); err != nil {
		return fmt.Errorf("Invalid UPDATE_LINKS payload: %w", err)
	}

	updatesMap := make(map[string]json.RawMessage)
	for _, item := range items {
		updatesMap[item.ID] = item.Updates
	}

	type LinkMove struct {
		Link        Link
		PanelKey    string
		NewCategory string
	}
	var linksToMove []LinkMove

	for panelKey, categories := range panels {
		for i := range categories {
			for j := range categories[i].Links {
				link := &panels[panelKey][i].Links[j]

				updatesJSON, found := updatesMap[link.ID]
				if !found {
					continue
				}

				var linkUpdates map[string]interface{}
				if err := json.Unmarshal(updatesJSON, &linkUpdates); err != nil {
					return fmt.Errorf("Failed to decode update for link %s: %w", link.ID, err)
				}
				if err := json.Unmarshal(updatesJSON, link); err != nil {
					return fmt.Errorf("Failed to apply updates to link %s: %w", link.ID, err)
				}

				if newCategory, ok := linkUpdates["category"].(string); ok {
					if newCategory == "" { newCategory = "Uncategorized" }
					if newCategory != panels[panelKey][i].Name {
						linksToMove = append(linksToMove, LinkMove{
							Link:        *link,
							PanelKey:    panelKey,
							NewCategory: newCategory,
						})
					}
				}
				delete(updatesMap, link.ID)
			}
		}
	}

	if len(linksToMove) > 0 {
		movesMap := make(map[string]bool)
		for _, move := range linksToMove {
			movesMap[move.Link.ID] = true
		}

		for panelKey, categories := range panels {
			for i := range categories {
				var remainingLinks []Link
				for _, link := range categories[i].Links {
					if !movesMap[link.ID] { remainingLinks = append(remainingLinks, link) }
				}
				panels[panelKey][i].Links = remainingLinks
			}
		}
	}

	for _, move := range linksToMove {
		targetPanel, _ := panels[move.PanelKey]
		targetCategory := findOrCreateCategory(&targetPanel, move.NewCategory)

		maxSort := -1
		for _, l := range targetCategory.Links {
			if l.Sort > maxSort { maxSort = l.Sort }
		}
		move.Link.Sort = maxSort + 1
		targetCategory.Links = append(targetCategory.Links, move.Link)
		panels[move.PanelKey] = targetPanel
	}
	return nil
}

// applyMoveLinks 移动链接
func applyMoveLinks(panels map[string][]LinkCategory, payload json.RawMessage) error {
	var p MoveLinksPayload
	if err := json.Unmarshal(payload, &p); err != nil {
		return fmt.Errorf("Invalid MOVE_LINKS payload: %w", err)
	}
	idsToMove := make(map[string]struct{})
	for _, id := range p.IDs {
		idsToMove[id] = struct{}{}
	}

	var movedLinks []Link
	for panelKey, categories := range panels {
		for i := range categories {
			var remainingLinks []Link
	for _, link := range categories[i].Links {
		if _, found := idsToMove[link.ID]; found {
			movedLinks = append(movedLinks, link)
		} else { remainingLinks = append(remainingLinks, link) }
	}
			panels[panelKey][i].Links = remainingLinks
		}
	}

	targetPanel, ok := panels[p.Target.Panel]
	if !ok {
		targetPanel = []LinkCategory{}
	}

	targetCategory := findOrCreateCategory(&targetPanel, p.Target.Category)

	maxSort := -1
	for _, link := range targetCategory.Links {
		if link.Sort > maxSort {
			maxSort = link.Sort
		}
	}

	for _, link := range movedLinks {
		maxSort++
		link.Sort = maxSort
		targetCategory.Links = append(targetCategory.Links, link)
	}
	panels[p.Target.Panel] = targetPanel
	return nil
}

// applyDeleteCategories 删除分类
func applyDeleteCategories(panels map[string][]LinkCategory, payload json.RawMessage) error {
	var items []DeleteCategoryPayload
	if err := json.Unmarshal(payload, &items); err != nil {
		return fmt.Errorf("Invalid DELETE_CATEGORIES payload: %w", err)
	}

	for _, catToDelete := range items {
		categories, ok := panels[catToDelete.Panel]
		if !ok {
			continue
		}

		var remainingCategories []LinkCategory
	for _, category := range categories {
		if category.Name != catToDelete.Category { remainingCategories = append(remainingCategories, category) }
	}
		panels[catToDelete.Panel] = remainingCategories
	}
	return nil
}

// applyReorderCategories 重排分类
func applyReorderCategories(panels map[string][]LinkCategory, payload json.RawMessage) error {
	var p ReorderCategoriesPayload
	if err := json.Unmarshal(payload, &p); err != nil {
		return fmt.Errorf("Invalid REORDER_CATEGORIES payload: %w", err)
	}

	currentCategories, ok := panels[p.Panel]
	if !ok {
		return fmt.Errorf("Panel not found for reordering: %s", p.Panel)
	}

	categoryMap := make(map[string]LinkCategory)
	for _, category := range currentCategories {
		categoryMap[category.Name] = category
	}

	reorderedCategories := make([]LinkCategory, 0, len(p.OrderedCategoryNames))
	for _, categoryName := range p.OrderedCategoryNames {
		if categoryName == "" { categoryName = "Uncategorized" }
		if category, found := categoryMap[categoryName]; found { reorderedCategories = append(reorderedCategories, category) }
	}
	panels[p.Panel] = reorderedCategories
	return nil
}

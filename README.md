# Navlty

A blazing fast, ultra-lightweight navigation dashboard.

---

## 🚀 Why Navlty?

The name **Navlty** is a blend of "Navigation" and "Novelty," with the `-lty` suffix suggesting "Lightweight." It's built on three core pillars:

*   **N**avigate: Focus on your most-used links.
*   **L**ight: Zero bloat, minimal footprint.
*   **T**y (Velocity): Instant load times, with a keyboard-first experience.

## ✨ Features

*   **Secure Authentication:** User login, logout, and password management.
*   **Link Management:** Easily add, edit, and delete your favorite links.
*   **Application Settings:** Customize the application to your needs.
*   **Modern Web Interface:** A clean and intuitive UI for managing your navigation.

## 📦 Getting Started

### Prerequisites

*   Go 1.18+
*   Podman (or Docker)

### Running Locally

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Dancying/Navlty.git
    cd navlty
    ```

2.  **Run the application:**
    ```bash
    go run main.go
    ```
    The server will start on `http://localhost:8080`.

### Building with Podman

You can easily build a container image for Navlty using Podman:

```bash
podman build -t navlty .
```

## API Endpoints

The following API endpoints are available:

*   `GET /auth/status`: Check user authentication status.
*   `POST /auth/login`: Log in a user.
*   `POST /auth/logout`: Log out a user.
*   `POST /api/auth/passwd`: Change user password (authenticated).
*   `GET /api/settings`: Get application settings (authenticated).
*   `POST /api/settings`: Update application settings (authenticated).
*   `GET /api/links`: Get all links (authenticated).
*   `POST /api/links`: Add a new link (authenticated).
*   `PUT /api/links`: Update a link (authenticated).
*   `DELETE /api/links`: Delete a link (authenticated).
*   `POST /api/links/actions`: Perform batch actions on links (authenticated).

## ✨ Design Philosophy

Navlty's core design philosophy revolves around three pillars for ultimate lightness, efficiency, and autonomy.

1.  **Minimalist Backend with Smart Compression**
    *   **Extremely Low Resource Usage:**
        *   The application is built in Go and compiled into a single binary.
        *   This ensures minimal CPU and memory consumption.
        *   Perfect for resource-constrained environments like a Raspberry Pi or home NAS.
    *   **Dynamic Compression:**
        *   The server dynamically compresses assets before returning them.
        *   This significantly reduces the size of transferred data, ensuring lightning-fast load times.

2.  **Self-Contained & On-Demand Loading**
    *   **Fully Self-Contained, No CDN Required:**
        *   The project does not rely on any external CDNs.
        *   All static assets like CSS and JavaScript are served by the application itself.
    *   **Smart On-Demand Loading:**
        *   Assets are divided into "public" (for the login page) and "authenticated" (for the admin dashboard).
        *   The system loads only the resources necessary for the current page based on the user's authentication status, avoiding unnecessary data transfer.

3.  **Self-Contained Management**
    *   **In-Browser Operations:**
        *   You can intuitively perform CRUD operations on navigation links directly in the web frontend.
        *   No need to edit configuration files or restart the service.
    *   **Instant Effect:**
        *   All changes are saved instantly, providing a smooth, seamless management experience.

---

## 📜 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2026 Dancying

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

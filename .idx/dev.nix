{ pkgs, ... }: {
  channel = "unstable";
  packages = [
    pkgs.go
    pkgs.gopls
    pkgs.go-outline
    pkgs.delve
    pkgs.gcc
  ];
  env = {};
  idx = {
    extensions = [
      "golang.go"
    ];
    workspace = {
      onCreate = {
        default.openFiles = [ "cmd/main.go" ];
      };
    };
    previews = {
      enable = true;
      previews = {
        web = {
          command = [ "go" "run" "cmd/main.go" ];
          manager = "web";
        };
      };
    };
  };
}

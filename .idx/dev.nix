# To learn more about how to use Nix to configure your environment
# see: https://developers.google.com/idx/guides/customize-idx-env
{ pkgs, ... }: {
  # Which nixpkgs channel to use.
  channel = "unstable"; # Using unstable to get a newer Go version
  # Use https://search.nixos.org/packages to find packages
  packages = [
    pkgs.go # Using the latest Go version
    pkgs.gopls # Go language server
    pkgs.go-outline # Go outline tool
    pkgs.delve # Go debugger
  ];
  # Sets environment variables in the workspace
  env = {};
  idx = {
    # Search for the extensions you want on https://open-vsx.org/ and use "publisher.id"
    extensions = [
      "golang.go"
    ];
    workspace = {
      # Runs when the workspace is created
      onCreate = {
        default.openFiles = [ "main.go" ];
      };
    };
    # Enable previews and customize configuration
    previews = {
      enable = true;
      previews = {
        web = {
          command = [ "go", "run", "main.go" ];
          manager = "web";
        };
      };
    };
  };
}

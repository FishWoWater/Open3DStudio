{ pkgs }: {
  deps = [
    pkgs.nodejs_20
    pkgs.nodePackages.typescript-language-server
    pkgs.yarn
    pkgs.replitPackages.jest
    # Serve static files for production deployment
    pkgs.nodePackages.serve
  ];
}

{ pkgs ? import (fetchTarball "https://github.com/NixOS/nixpkgs/tarball/nixos-23.11") {} }:

pkgs.mkShellNoCC {
  packages = with pkgs; [
    bun
    jq
    postgresql
  ];

  shellHook = ''
    # Initialize PostgreSQL data directory if it doesn't exist
    if [ ! -d ./pgdata ]; then
      initdb --username=user --pwfile=<(echo password) -D ./pgdata
    fi

    # Start PostgreSQL server
    pg_ctl -D ./pgdata -l logfile start

    # Set user and password in the running server
    psql -c "ALTER USER user WITH PASSWORD 'password';" || true

    echo "PostgreSQL is running. Use 'psql' to connect."
  '';
}

#!/usr/bin/env bash

echo "::set-output name=renovate::$(npm info renovate --json | jq -r .version)"
echo "::set-output name=poetry::$(curl -sSl https://pypi.org/pypi/poetry/json | jq .info.version -r)"
echo "::set-output name=PY::$(python -VV | md5sum | cut -d' ' -f1)"

echo "::add-path::$HOME/.local/bin"
echo "::add-path::$HOME/.poetry/bin"

#!/usr/bin/env bash

PY=$(python --version)

echo "::set-output name=renovate::$(npm info renovate --json | jq -r .version)"
echo "::set-output name=poetry::$(curl -sSl https://pypi.org/pypi/poetry/json | jq .info.version -r)"
echo "::set-output name=python::${PY// /_}"
echo "::set-output name=date::$(date '+%Y-%M-%d')"

echo "::add-path::$HOME/.local/bin"
echo "::add-path::$HOME/.poetry/bin"

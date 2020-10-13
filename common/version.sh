#!/usr/bin/env bash

echo "::set-env name=PY::$(python -VV | md5sum | cut -d' ' -f1)"

echo "$HOME/.local/bin" >>$GITHUB_PATH

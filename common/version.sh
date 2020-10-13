#!/usr/bin/env bash

echo "PY=$(python -VV | md5sum | cut -d' ' -f1)" >>$GITHUB_ENV
echo "$HOME/.local/bin" >>$GITHUB_PATH

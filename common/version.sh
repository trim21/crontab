#!/usr/bin/env bash

echo "::set-env name=PY::$(python -VV | md5sum | cut -d' ' -f1)"

echo "::add-path::$HOME/.local/bin"

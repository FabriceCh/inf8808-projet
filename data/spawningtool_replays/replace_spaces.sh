#!/usr/bin/env sh
for f in *\ *; do mv "$f" "${f// /_}"; done

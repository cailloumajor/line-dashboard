#!/bin/sh
set -e

host="$(hostname --ip-address || echo '127.0.0.1')"

if curl -fsS "http://$host:8080" | grep -q '^<!DOCTYPE html>'; then
        exit 0
fi

exit 1

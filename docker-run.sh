#!/bin/sh

set -ex

rm -rfv /srv/www/*
cp -av /site/. /srv/www/

{ set +x; } 2>/dev/null

trap "echo Received signal; exit 0" INT TERM

echo Looping forever...
while :; do
    sleep 1
done

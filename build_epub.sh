#!/bin/sh
set -euo pipefail

for dir in ./trans/*/
do
    dir=${dir%*/}
    lang=${dir##*/}
    echo "Converting ${lang} document"
    pandoc --from=latex --to=epub --resource-path="./export/img" -o ./export/${lang}.epub ${dir}/*.tex
done

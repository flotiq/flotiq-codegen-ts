#!/bin/bash

js="--js"

file_patterns="src/models/*WithoutInternal.ts src/models/*WithoutRequired.ts"
delete_line="import { DataSource, DataSourceFromJSON } from './DataSource';"

for arg in "$@"; do
  if [ "$arg" = "$s" ]; then
    file_patterns="src/models/*WithoutInternal.js src/models/*WithoutRequired.js"
    break
  fi
done

escaped_delete_line=$(printf '%s\n' "$delete_line" | sed 's:[][\/.^$*]:\\&:g')

for file in $file_patterns; do
  if grep -Fq "$delete_line" "$file"; then
    sed -i '' "/$escaped_delete_line/d" "$file"
  fi
done

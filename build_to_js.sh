#!/bin/bash

mkdir ./flotiqApiBuildJs

tsc -p ./flotiqAPi/

mv -f flotiqAPi/dist/* flotiqApiBuildJs
rm -fr flotiqAPi

exit 0
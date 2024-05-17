#!/bin/bash

mkdir ./flotiqApiBuildJs

tsc -p ./flotiqApi/

mv -f flotiqApi/dist/* flotiqApiBuildJs
rm -fr flotiqApi

exit 0
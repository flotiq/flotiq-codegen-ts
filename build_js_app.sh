#!/bin/bash

mkdir ./flotiqApiBuildJs
cd flotiqAPi; tsc
cd ..

mv -f flotiqAPi/dist/* flotiqApiBuildJs
exit 0

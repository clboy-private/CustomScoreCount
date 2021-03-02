#!/bin/bash
git add .
echo -e "输入提交信息：\c"
read msg
git commit -m "${msg}"
git push
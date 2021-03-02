#!/bin/bash
git add .
echo "输入提交信息:"
read msg
git commit -m "更新${msg}",
git push
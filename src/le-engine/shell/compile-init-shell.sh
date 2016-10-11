#!/bin/sh


# #############################################
# Copyright (c) 2016-2026 letv Inc. All rights reserved.
# #############################################
#
# Name:  镜像编译脚本
# Date:
# Author:
# Email:
# Desc:
#
#

set -e

# 您的代码在 /code 下
# 举例说明： 假如您的git 地址是： git@git.letv.cn:saas/uc_new.git
# git 库中文件结构如下:
#
# -- uc (dir)
# |  |
# |   -- uc-api (dir)
# |  |
# |   -- uc-ms  (dir)
# |
# |-- README.mg （file）
#
# 那么 /code 文件夹下的文件结构如下：
#
# -- uc (dir)
# |  |
# |   -- uc-api (dir)
# |  |
# |   -- uc-ms  (dir)
# |
# |-- README.mg （file）
#

cd  /code

# 请书写相关的编译命令，例如 mvn clean package -DskipTests -Dmaven.test.skip=true







# 为了增加构建速度，我们强烈建议您只保留 /code 文件夹下编译出来的二进制文件
# 您可以执行诸如类似下面的操作:
# 临时拷贝
# cp -rf /code/target/dist.war /letv/dist.war

# 删除源文件
# rm -rf /code/*

# 重新拷贝
# cp -rf /letv/dist.war /code/
#!/bin/bash
set -e

git checkout gh-pages
git reset --hard main
git push
git checkout main

echo "Deployment to gh-pages complete!" 
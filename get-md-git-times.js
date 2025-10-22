#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const crc = require("crc");
const moment = require("moment");

const md5 = (str) => crc.crc32(str);
/**
 * 递归获取目录下所有md文件
 * @param {string} dir 目录路径
 * @param {string[]} fileList 文件列表
 * @returns {string[]} md文件路径数组
 */
function getAllMdFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // 跳过.git目录
      if (file !== ".git") {
        getAllMdFiles(filePath, fileList);
      }
    } else if (path.extname(file) === ".md") {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * 将文件路径转换为MD5格式的key
 * @param {string} filePath 文件路径
 * @returns {string} MD5格式的key
 */
function convertPathToMd5Key(path) {
  path = path.replace(/\.md$/, "");
  const tag = "/blog";
  const idx = path.indexOf(tag);
  const relPath = idx !== -1 ? path.slice(idx + tag.length) : path;
  return relPath
    .split("/")
    .filter((i) => !!i)
    .map((item) => md5(item))
    .join("/");
}

/**
 * 获取文件的最后一次git提交时间
 * @param {string} filePath 文件路径
 * @returns {string|null} 提交时间字符串或null
 */
function getLastCommitTime(filePath) {
  try {
    // 使用git log命令获取文件的最后一次提交时间
    const command = `git log -1 --format="%ci" -- "${filePath}"`;
    const result = execSync(command, {
      encoding: "utf8",
      cwd: process.cwd(),
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();

    return result || null;
  } catch (error) {
    console.warn(`无法获取文件 ${filePath} 的git信息:`, error.message);
    return null;
  }
}

/**
 * 主函数
 */
function createMdGitTimesJson(targetDir) {
  console.log(`正在扫描目录: ${targetDir}`);

  // 获取所有md文件
  const mdFiles = getAllMdFiles(targetDir);
  console.log(`找到 ${mdFiles.length} 个md文件`);

  // 获取每个文件的git提交时间
  const result = {};
  let processedCount = 0;

  mdFiles.forEach((filePath) => {
    const relativePath = path.relative(targetDir, filePath);
    const commitTime = getLastCommitTime(filePath);

    // 将路径转换为MD5格式的key
    const md5Key = convertPathToMd5Key(relativePath);
    result[md5Key] = moment(commitTime).isValid()
      ? moment(commitTime).unix()
      : null;
    processedCount++;

    if (processedCount % 10 === 0) {
      console.log(`已处理 ${processedCount}/${mdFiles.length} 个文件`);
    }
  });

  console.log(`\n处理完成！`);
  console.log(`共处理 ${mdFiles.length} 个文件`);

  // 显示统计信息
  const validTimes = Object.values(result).filter(
    (time) => time !== null
  ).length;
  console.log(`其中 ${validTimes} 个文件有git提交记录`);

  return result;
}

module.exports = {
  getAllMdFiles,
  convertPathToMd5Key,
  getLastCommitTime,
  createMdGitTimesJson,
};

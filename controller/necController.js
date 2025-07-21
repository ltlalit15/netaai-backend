const db = require('../config');
const express = require('express');
const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');


const app = express();
app.use(express.json());


exports.filterNecCodeAndCopyPages = async (req, res) => {
  try {
    const necCodeToSearch = req.body.nec_code;

    if (!necCodeToSearch) {
      return res.status(400).json({ message: 'NEC code is required.' });
    }

    // Paths
    const baseDir = path.join(__dirname, '..');
    //const baseDir = 'C:/Users/Muhammad Rehan/Downloads/netaai-backend-main (1)/netaai-backend-main';
    const inputJsonPath = path.join(baseDir, 'nec_matches.json');
    const outputJsonPath = path.join(baseDir, 'filtered_nec_matches.json');
    const matchedPagesDir = path.join(baseDir, 'matched_pages');
    const targetDir = path.join(
      baseDir,
      'matched_pages_filtered',
      necCodeToSearch.replace(/[ .()]/g, '')
    );

    // Check if nec_matches.json exists
    if (!fs.existsSync(inputJsonPath)) {
      return res.status(404).json({ message: '❌ nec_matches.json not found.' });
    }

    // Load and filter JSON data
    const allMatches = JSON.parse(fs.readFileSync(inputJsonPath, 'utf-8'));
    const filtered = allMatches.filter(entry =>
      entry.nec_code.toLowerCase().includes(necCodeToSearch.toLowerCase())
    );

    // Ensure output folder
    await fse.ensureDir(targetDir);

    let missingFiles = [];
    let copiedFiles = 0;

    const availableFolders = fs.readdirSync(matchedPagesDir);

    for (const entry of filtered) {
      const rawFolder = entry.folder || '';
      const normalizedFolder = rawFolder.replace(/[\\/]/g, '_');
      const folderPath = path.join(matchedPagesDir, normalizedFolder);

      if (!fs.existsSync(folderPath)) {
        console.warn(`❌ Folder not found: ${folderPath}`);
        missingFiles.push(`Folder missing: ${folderPath}`);
        continue;
      }

      // Try to match file strictly first
      const exactFilePath = path.join(folderPath, entry.file);
      if (fs.existsSync(exactFilePath)) {
        const destPath = path.join(targetDir, entry.file);
        await fse.copy(exactFilePath, destPath);
        console.log(`Copied: ${entry.file}`);
        copiedFiles++;
        continue;
      }

      // Fallback: Try to match file by pattern
      const filesInFolder = fs.readdirSync(folderPath);
      const guessedFile = filesInFolder.find(f =>
        f.toLowerCase().includes(entry.file.toLowerCase().split('.')[0])
      );

      if (guessedFile) {
        const sourcePath = path.join(folderPath, guessedFile);
        const destPath = path.join(targetDir, guessedFile);
        await fse.copy(sourcePath, destPath);
        console.log(`Guessed & Copied: ${guessedFile}`);
        copiedFiles++;
      } else {
        console.warn(`File not found: ${entry.file} in ${folderPath}`);
        missingFiles.push(path.join(folderPath, entry.file));
      }
    }

    // Save filtered JSON result
    fs.writeFileSync(outputJsonPath, JSON.stringify(filtered, null, 2), 'utf-8');

    res.json({
      message: '✅ NEC code filtered and files processed.',
      filteredCount: filtered.length,
      copiedCount: copiedFiles,
      missingCount: missingFiles.length,
      outputJson: outputJsonPath,
      outputDir: targetDir,
     // missingFiles: missingFiles,
    });

  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

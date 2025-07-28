const db = require('../config');
const express = require('express');
const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');


exports.mergeArticlePDFs = async (req, res) => {
  try {
    const PDFMerger = (await import('pdf-merger-js')).default; // ✅ Dynamic import

    console.log('📥 Request received for merging article PDFs.');

    const searchQuery = req.body.search || '';
    const match = searchQuery.match(/\b\d+\b/);
    const articleNumber = match ? match[0] : null;

    if (!articleNumber) {
      return res.status(400).json({
        status: 'error',
        message: '❌ Could not extract article number from input.'
      });
    }

    const baseDir = path.join(__dirname, '..');
    const sourceFolder = path.join(baseDir, 'nec-pdfs', `article ${articleNumber}`);
    const outputFolder = path.join(baseDir, 'mergedpdf');

    fs.mkdirSync(outputFolder, { recursive: true });

    if (!fs.existsSync(sourceFolder)) {
      return res.status(404).json({
        status: 'error',
        message: `❌ Folder not found: article ${articleNumber}`
      });
    }

    const pdfFiles = fs.readdirSync(sourceFolder)
      .filter(f => f.toLowerCase().endsWith('.pdf'))
      .sort();

    if (pdfFiles.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: '❌ No PDF files found in the folder.'
      });
    }

    const merger = new PDFMerger();

    for (const file of pdfFiles) {
      await merger.add(path.join(sourceFolder, file));
    }

    const outputFileName = `article ${articleNumber}_merged.pdf`;
    const outputPath = path.join(outputFolder, outputFileName);
    await merger.save(outputPath);

    return res.json({
      status: 'success',
      article: articleNumber,
      merged_pdf_path: outputPath.replace(/\\/g, '/')
    });

  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      error: err.message
    });
  }
};


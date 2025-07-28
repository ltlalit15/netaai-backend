const db = require('../config');
const express = require('express');
const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');


const PDFMerger = require('pdf-merger-js') // 👈 FIXED LINE

exports.mergeArticlePDFs = async (req, res) => {
  try {
    console.log('📥 Request received for merging article PDFs.');

    const searchQuery = req.body.search || '';
    console.log('🔎 Search Query:', searchQuery);

    const match = searchQuery.match(/\b\d+\b/);
    const articleNumber = match ? match[0] : null;
    console.log('📄 Extracted Article Number:', articleNumber);

    if (!articleNumber) {
      return res.status(400).json({
        status: 'error',
        message: '❌ Could not extract article number from input.'
      });
    }

    // Adjusted base path
    const baseDir = path.join(__dirname, '..');
    const sourceFolder = path.join(baseDir, 'nec-pdfs', `article ${articleNumber}`);
    const outputFolder = path.join(baseDir, 'mergedpdf');

    console.log('📁 Source Folder:', sourceFolder);
    console.log('📁 Output Folder:', outputFolder);

    // Ensure output directory
    fs.mkdirSync(outputFolder, { recursive: true });
    console.log('✅ Output directory ensured.');

    if (!fs.existsSync(sourceFolder)) {
      console.log(`❌ Source folder not found for article ${articleNumber}`);
      return res.status(404).json({
        status: 'error',
        message: `❌ Folder not found: article ${articleNumber}`
      });
    }

    const pdfFiles = fs.readdirSync(sourceFolder)
      .filter(f => f.toLowerCase().endsWith('.pdf'))
      .sort();

    console.log('📄 PDF Files Found:', pdfFiles);

    if (pdfFiles.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: '❌ No PDF files found in the folder.'
      });
    }

    const merger = new PDFMerger();

    for (const file of pdfFiles) {
      const filePath = path.join(sourceFolder, file);
      console.log('➕ Adding PDF:', filePath);
      await merger.add(filePath);
    }

    const outputFileName = `article ${articleNumber}_merged.pdf`;
    const outputPath = path.join(outputFolder, outputFileName);
    await merger.save(outputPath);

    console.log('✅ PDF merged successfully:', outputPath);

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

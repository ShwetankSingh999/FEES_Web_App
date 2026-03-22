/**
 * FEES Evaluation App — PDF Report Generator
 * Uses jsPDF to produce a professional clinical report
 */

function generateFEESReport(formData) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const { suggestions, diets, findings } = generateTherapySuggestions(formData);

  const PAGE_W = 210;
  const MARGIN = 18;
  const CONTENT_W = PAGE_W - MARGIN * 2;
  let y = 0;

  /* ──────────────────────────────────────
     HELPERS
  ───────────────────────────────────────*/

  function checkPage(needed = 14) {
    if (y + needed > 275) {
      doc.addPage();
      y = 20;
      drawHeader(false);
      y += 8;
    }
  }

  function colorFromHex(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  }

  function hLine(yPos, r = 200, g = 200, b = 200) {
    doc.setDrawColor(r, g, b);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, yPos, PAGE_W - MARGIN, yPos);
  }

  function sectionTitle(text, icon = '') {
    checkPage(16);
    doc.setFillColor(0, 150, 130);
    doc.roundedRect(MARGIN, y, CONTENT_W, 9, 1.5, 1.5, 'F');
    doc.setFontSize(10); doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    const titleText = icon ? `${icon}  ${text}` : text;
    doc.text(titleText, MARGIN + 4, y + 6.2);
    doc.setTextColor(30, 30, 30);
    y += 13;
  }

  function fieldRow(label, value, mono = false) {
    checkPage(9);
    doc.setFontSize(8.5); doc.setFont('helvetica', 'bold');
    doc.setTextColor(90, 90, 90);
    doc.text(label + ':', MARGIN, y);
    doc.setFont(mono ? 'courier' : 'helvetica', 'normal');
    doc.setTextColor(20, 20, 20);
    const wrapped = doc.splitTextToSize(value || '—', CONTENT_W - 52);
    doc.text(wrapped, MARGIN + 52, y);
    y += Math.max(6, wrapped.length * 5);
  }

  function paragraph(text, indent = 0) {
    if (!text) return;
    checkPage(10);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    const lines = doc.splitTextToSize(text, CONTENT_W - indent);
    doc.text(lines, MARGIN + indent, y);
    y += lines.length * 5 + 2;
  }

  function bulletPoint(text, color = [0, 150, 130]) {
    checkPage(8);
    doc.setFillColor(...color);
    doc.circle(MARGIN + 3, y - 1.2, 1.2, 'F');
    doc.setFontSize(8.5); doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    const lines = doc.splitTextToSize(text, CONTENT_W - 9);
    doc.text(lines, MARGIN + 7, y);
    y += lines.length * 4.8 + 1.5;
  }

  function priorityBadge(priority, xPos, yPos) {
    const colors = {
      CRITICAL: [200, 30, 30],
      HIGH:     [220, 100, 20],
      MODERATE: [180, 140, 0],
      LOW:      [30, 140, 80]
    };
    const c = colors[priority] || [100, 100, 100];
    doc.setFillColor(...c);
    doc.roundedRect(xPos, yPos - 4, 22, 6, 1, 1, 'F');
    doc.setFontSize(7); doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(priority, xPos + 11, yPos, { align: 'center' });
    doc.setTextColor(30, 30, 30);
  }

  /* ──────────────────────────────────────
     HEADER (every page's first instance)
  ───────────────────────────────────────*/

  function drawHeader(firstPage = true) {
    // Teal banner
    doc.setFillColor(0, 150, 130);
    doc.rect(0, 0, PAGE_W, firstPage ? 38 : 14, 'F');

    if (firstPage) {
      doc.setFontSize(18); doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('FEES Evaluation Report', MARGIN, 16);
      doc.setFontSize(9.5); doc.setFont('helvetica', 'normal');
      doc.text('Fiberoptic Endoscopic Evaluation of Swallowing', MARGIN, 23);

      doc.setFontSize(8.5);
      const dateStr = formData.patient?.evaluationDate || new Date().toLocaleDateString();
      doc.text(`Date: ${dateStr}    Evaluator: ${formData.patient?.evaluatorName || ''}`, MARGIN, 30);

      // Accent right side decorative
      doc.setFillColor(0, 180, 160);
      doc.circle(PAGE_W - 20, 8, 18, 'F');
      doc.setFillColor(0, 210, 190);
      doc.circle(PAGE_W - 10, 25, 10, 'F');

      y = 46;
    } else {
      doc.setFontSize(8); doc.setFont('helvetica', 'italic');
      doc.setTextColor(255, 255, 255);
      doc.text('FEES Evaluation Report — Continued', MARGIN, 10);
    }

    doc.setTextColor(30, 30, 30);
  }

  /* ══════════════════════════════════════
     PAGE 1 — HEADER + PATIENT INFO
  ═══════════════════════════════════════*/

  drawHeader(true);

  /* ──────── Patient Information ──────── */
  sectionTitle('PATIENT INFORMATION');

  const p = formData.patient || {};
  fieldRow('Patient Name', p.name);
  fieldRow('Date of Birth', p.dob);
  fieldRow('Age', p.age ? `${p.age} years` : '');
  fieldRow('Gender', p.gender);
  fieldRow('MRN / ID', p.mrn);
  fieldRow('Referring Physician', p.referringPhysician);
  fieldRow('Primary Diagnosis', p.primaryDiagnosis);
  fieldRow('Reason for Referral', p.reasonForReferral);
  fieldRow('Date of Evaluation', p.evaluationDate);
  fieldRow('Evaluator Name / Credentials', p.evaluatorName);
  fieldRow('Facility / Setting', p.facility);
  y += 4;

  /* ══════════════════════════════════════
     PRE-SWALLOW ASSESSMENT
  ═══════════════════════════════════════*/

  checkPage(20);
  sectionTitle('PRE-SWALLOW ASSESSMENT — STRUCTURAL & FUNCTIONAL FINDINGS');

  const ps = formData.preSwallow || {};

  // Two-column mini grid
  const col1x = MARGIN;
  const col2x = MARGIN + CONTENT_W / 2 + 4;
  const startY2col = y;

  const findings2col = [
    ['Pharyngeal Symmetry', ps.pharyngealSymmetry],
    ['Vocal Fold Appearance', ps.vfAppearance],
    ['VF Mobility — Left', ps.vocalFoldMobilityLeft],
    ['VF Mobility — Right', ps.vocalFoldMobilityRight],
    ['Velopharyngeal Closure', ps.velopharyngeal],
    ['Laryngeal Elevation', ps.laryngealElevation],
    ['Sensation', ps.sensation],
    ['Base of Tongue Retraction', ps.tongueBaseRetraction]
  ];

  findings2col.forEach((item, i) => {
    const col = i % 2 === 0 ? col1x : col2x;
    if (i % 2 === 0 && i !== 0) y += 7;
    if (i % 2 !== 0) y = startY2col + Math.floor(i / 2) * 7;

    checkPage(8);
    doc.setFontSize(8); doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text(item[0] + ':', col, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(20, 20, 20);

    const val = item[1] || '—';
    const isAbnormal = ['reduced', 'absent', 'incomplete', 'asymmetric', 'lesion'].includes(val?.toLowerCase());
    if (isAbnormal) doc.setTextColor(200, 60, 60);
    doc.text(val || '—', col + 45, y);
    doc.setTextColor(20, 20, 20);
  });

  y = startY2col + Math.ceil(findings2col.length / 2) * 7 + 5;

  fieldRow('Secretion Rating', ps.secretionRating ? `${ps.secretionRating}/4 — ${FEES_DATA.secretionScale[parseInt(ps.secretionRating)]?.label || ''}` : '—');
  if (ps.preSwallowNotes) {
    checkPage(12);
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(80, 80, 80);
    doc.text('Clinical Notes:', MARGIN, y); y += 5;
    paragraph(ps.preSwallowNotes, 2);
  }
  y += 4;

  /* ══════════════════════════════════════
     SWALLOW TRIALS TABLE
  ═══════════════════════════════════════*/

  checkPage(30);
  sectionTitle('SWALLOW TRIALS');

  const trials = formData.swallowTrials || [];
  if (trials.length === 0) {
    paragraph('No swallow trials recorded.');
  } else {
    // Table headers
    const cols = { n: 12, cons: 30, vol: 20, pas: 15, init: 20, air: 20, residue: 31, cough: 26 };
    const headers = ['#', 'Consistency', 'Volume', 'PAS', 'Initiation', 'Airway', 'Residue', 'Cough'];
    const colKeys = Object.keys(cols);

    checkPage(12);
    doc.setFillColor(240, 248, 247);
    doc.rect(MARGIN, y, CONTENT_W, 8, 'F');
    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 120, 110);

    let xOff = MARGIN + 2;
    headers.forEach((h, i) => { doc.text(h, xOff, y + 5.3); xOff += cols[colKeys[i]]; });
    y += 9;
    hLine(y, 180, 220, 215);
    y += 2;

    trials.forEach((trial, idx) => {
      checkPage(10);
      if (idx % 2 === 0) {
        doc.setFillColor(250, 252, 252);
        doc.rect(MARGIN, y - 1, CONTENT_W, 8.5, 'F');
      }

      doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(20, 20, 20);
      xOff = MARGIN + 2;

      const pas = parseInt(trial.pasScore) || 0;
      const pasDef = FEES_DATA.PAScale[pas];
      const pasColor = pas <= 2 ? [30, 160, 30] : pas <= 5 ? [200, 140, 0] : [200, 30, 30];

      const rowData = [
        `${idx + 1}`,
        trial.consistency || '—',
        trial.volume || '—',
        pas > 0 ? `${pas}` : '—',
        trial.swallowInitiation || '—',
        trial.airwayClosure || '—',
        (trial.residueLocations || []).join(', ') || 'None',
        trial.coughResponse || '—'
      ];

      rowData.forEach((val, i) => {
        if (i === 3 && pas > 0) doc.setTextColor(...pasColor);
        else doc.setTextColor(20, 20, 20);
        doc.text(String(val), xOff, y + 4.5);
        xOff += cols[colKeys[i]];
      });

      if (trial.trialNotes) {
        y += 9;
        doc.setFontSize(7.5); doc.setTextColor(100, 100, 100);
        doc.text(`   Note: ${trial.trialNotes}`, MARGIN + 2, y);
      }

      y += 9;
    });
  }
  y += 4;

  /* ══════════════════════════════════════
     THERAPEUTIC ASSESSMENT
  ═══════════════════════════════════════*/

  checkPage(20);
  sectionTitle('THERAPEUTIC / COMPENSATORY STRATEGY ASSESSMENT');

  const strategies = formData.therapeutic?.strategies || [];
  if (strategies.length === 0) {
    paragraph('No therapeutic strategies trialed.');
  } else {
    strategies.forEach(s => {
      if (!s.effectiveness) return;
      checkPage(8);
      const effColors = { effective: [30, 160, 30], partial: [200, 140, 0], ineffective: [200, 30, 30] };
      const c = effColors[s.effectiveness] || [100, 100, 100];
      doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...c);
      doc.text(`● ${s.name}`, MARGIN + 2, y);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80);
      doc.text(` — ${s.effectiveness}`, MARGIN + 2 + doc.getTextWidth(`● ${s.name}`), y);
      if (s.notes) { doc.setTextColor(120, 120, 120); doc.text(`  (${s.notes})`, MARGIN + 2 + doc.getTextWidth(`● ${s.name} — ${s.effectiveness}`), y); }
      doc.setTextColor(20, 20, 20);
      y += 7;
    });
  }
  if (formData.therapeutic?.therapeuticNotes) {
    y += 2;
    paragraph(`Notes: ${formData.therapeutic.therapeuticNotes}`, 2);
  }
  y += 4;

  /* ══════════════════════════════════════
     DIET RECOMMENDATIONS
  ═══════════════════════════════════════*/

  checkPage(24);
  sectionTitle('DIETARY RECOMMENDATIONS (IDDSI)');

  // Liquid recommendation
  checkPage(12);
  doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(40, 40, 40);
  doc.text('Liquid Consistency:', MARGIN, y);
  const liq = diets.liquid;
  doc.setFillColor(...colorFromHex(liq.color || '#ffffff'));
  doc.roundedRect(MARGIN + 42, y - 5, 30, 8, 2, 2, 'F');
  doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0);
  doc.text(`IDDSI ${liq.level} — ${liq.name}`, MARGIN + 44, y);
  doc.setTextColor(80, 80, 80); doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
  doc.text(liq.description || '', MARGIN + 44, y + 6);
  y += 14;

  // Food recommendation
  checkPage(12);
  doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(40, 40, 40);
  doc.text('Food Texture:', MARGIN, y);
  const food = diets.food;
  doc.setFillColor(...colorFromHex(food.color || '#ffffff'));
  doc.roundedRect(MARGIN + 42, y - 5, 30, 8, 2, 2, 'F');
  doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0);
  doc.text(`IDDSI ${food.level} — ${food.name}`, MARGIN + 44, y);
  doc.setTextColor(80, 80, 80); doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
  doc.text(food.description || '', MARGIN + 44, y + 6);
  y += 16;

  /* ══════════════════════════════════════
     THERAPY RECOMMENDATIONS
  ═══════════════════════════════════════*/

  checkPage(24);
  sectionTitle('THERAPY RECOMMENDATIONS');

  if (suggestions.length === 0) {
    paragraph('Swallowing function appears within normal limits. No active therapy indicated at this time. Recommend monitoring.');
  } else {
    suggestions.forEach(s => {
      checkPage(28);

      // Finding banner
      doc.setFillColor(248, 248, 248);
      doc.roundedRect(MARGIN, y, CONTENT_W, 8, 1.5, 1.5, 'F');
      priorityBadge(s.priority, PAGE_W - MARGIN - 24, y + 4);
      doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 30);
      doc.text(s.finding, MARGIN + 3, y + 5.5);
      y += 11;

      if (s.immediateAction) {
        checkPage(10);
        doc.setFillColor(255, 240, 240);
        doc.roundedRect(MARGIN, y, CONTENT_W, 9, 1, 1, 'F');
        doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(200, 30, 30);
        doc.text('!  Immediate Action: ', MARGIN + 2, y + 5.5);
        doc.setFont('helvetica', 'normal');
        doc.text(s.immediateAction, MARGIN + 36, y + 5.5);
        doc.setTextColor(20, 20, 20);
        y += 12;
      }

      if (s.therapies?.length) {
        checkPage(8);
        doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 120, 110);
        doc.text('Recommended Therapeutic Exercises:', MARGIN + 2, y); y += 5;
        s.therapies.forEach(t => {
          checkPage(18);
          doc.setFont('helvetica', 'bold'); doc.setTextColor(20, 20, 20); doc.setFontSize(8.5);
          doc.text(`>  ${t.name}`, MARGIN + 4, y); y += 5;
          doc.setFont('helvetica', 'italic'); doc.setTextColor(80, 80, 80); doc.setFontSize(7.5);
          const descLines = doc.splitTextToSize(t.description, CONTENT_W - 12);
          doc.text(descLines, MARGIN + 8, y); y += descLines.length * 4.5;
          doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 60, 160);
          const prot = doc.splitTextToSize(`Protocol: ${t.protocol}`, CONTENT_W - 12);
          doc.text(prot, MARGIN + 8, y); y += prot.length * 4.5 + 3;
          doc.setTextColor(20, 20, 20);
        });
      }

      if (s.compensatoryStrategies?.length) {
        checkPage(10);
        doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 120, 110);
        doc.text('Compensatory Strategies to Trial:', MARGIN + 2, y); y += 5;
        s.compensatoryStrategies.forEach(cs => bulletPoint(cs, [0, 140, 120]));
        y += 2;
      }

      hLine(y, 220, 230, 228);
      y += 6;
    });
  }

  /* ══════════════════════════════════════
     CLINICAL IMPRESSIONS
  ═══════════════════════════════════════*/

  if (formData.summary?.clinicalImpression) {
    checkPage(20);
    sectionTitle('CLINICAL IMPRESSIONS & ADDITIONAL NOTES');
    paragraph(formData.summary.clinicalImpression, 2);
    y += 4;
  }

  /* ══════════════════════════════════════
     FOLLOW-UP & SIGNATURES
  ═══════════════════════════════════════*/

  checkPage(40);
  sectionTitle('FOLLOW-UP PLAN');

  const followUp = formData.summary?.followUp || 'To be determined based on patient progress.';
  paragraph(followUp, 2);
  y += 10;

  // Signature lines
  checkPage(30);
  doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(40, 40, 40);

  const sig1x = MARGIN;
  const sig2x = MARGIN + CONTENT_W / 2 + 10;

  hLine(y, 100, 100, 100); y += 5;
  doc.text(formData.patient?.evaluatorName || 'Evaluating Clinician', sig1x, y);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(100, 100, 100);
  doc.text('Speech-Language Pathologist', sig1x, y + 5);

  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(40, 40, 40);
  doc.text('Date:', sig2x, y - 7);
  hLine(y - 0.5, 100, 100, 100);

  /* ──────── Footer ──────── */
  const totalPages = doc.internal.getNumberOfPages();
  for (let pi = 1; pi <= totalPages; pi++) {
    doc.setPage(pi);
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(160, 160, 160);
    doc.text(`FEES Evaluation Report — Confidential Medical Document    |    Page ${pi} of ${totalPages}`, MARGIN, 291);
    doc.text(formData.patient?.name ? `Patient: ${formData.patient.name}   MRN: ${formData.patient.mrn || '—'}` : '', PAGE_W - MARGIN, 291, { align: 'right' });
    doc.setDrawColor(0, 150, 130);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, 288, PAGE_W - MARGIN, 288);
  }

  // Save
  const filename = `FEES_Report_${(formData.patient?.name || 'Patient').replace(/\s+/g, '_')}_${formData.patient?.evaluationDate || new Date().toISOString().slice(0,10)}.pdf`;
  doc.save(filename);
}

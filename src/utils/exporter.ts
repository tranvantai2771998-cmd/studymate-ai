import { StudySummary, ConceptNote, Quiz, StudyTask } from '../types';

export function formatSummaryToMarkdown(summary: StudySummary): string {
  return `# ${summary.title}
*Chuyên khoa: ${summary.subject} | Ngôn ngữ: ${summary.language.toUpperCase()} | Ngày tạo: ${new Date(summary.createdAt).toLocaleString('vi-VN')}*
*Mức độ chi tiết: ${summary.detailLevel} | Thẻ: ${summary.tags.join(', ')}*

---

## 1. Tổng quan Nội dung (Executive Overview)
${summary.overview}

## 2. Các Luận điểm & Kiến thức Trọng tâm
${summary.keyPoints.map((pt, i) => `${i + 1}. ${pt}`).join('\n')}

${summary.clinicalAspects ? `
## 3. Khía cạnh Y học & Lâm sàng (Clinical Aspects)
- **Cấu trúc giải phẫu liên quan:** ${summary.clinicalAspects.anatomicalStructures || 'Chưa có thông tin'}
- **Biểu hiện lâm sàng & Triệu chứng:** ${summary.clinicalAspects.clinicalManifestations || 'Chưa có thông tin'}
- **Nguyên tắc chẩn đoán:** ${summary.clinicalAspects.diagnosticPrinciples || 'Chưa có thông tin'}
- **Nguyên tắc điều trị:** ${summary.clinicalAspects.treatmentPrinciples || 'Chưa có thông tin'}
- **Chống chỉ định & Biến chứng:** ${summary.clinicalAspects.contraindications || 'Chưa có thông tin'}
` : ''}

## 4. Thuật ngữ & Định nghĩa Chuyên môn (Glossary)
${summary.glossary.map((g) => `- **${g.term}:** ${g.definition}`).join('\n')}

${summary.pitfalls && summary.pitfalls.length > 0 ? `
## 5. Những Điểm Dễ Nhầm Lẫn Cần Tránh (Common Pitfalls)
${summary.pitfalls.map((p) => `- ⚠️ ${p}`).join('\n')}
` : ''}

## 6. Câu hỏi Tự Kiểm tra Mức độ Hiểu bài
${summary.reflectionQuestions.map((q, i) => `Q${i + 1}: ${q}`).join('\n')}

${summary.takeawayAction ? `
## 7. Gợi ý Hành động Thực tế
> ${summary.takeawayAction}
` : ''}

---
*Biên soạn bởi StudyMate AI — Trợ lý Học tập Cá nhân hóa*
`;
}

export function formatConceptToMarkdown(concept: ConceptNote): string {
  return `# Giải thích Khái niệm: ${concept.topic}
*Môn học: ${concept.subject} | Chế độ: ${concept.mode.toUpperCase()} | Ngày tạo: ${new Date(concept.createdAt).toLocaleString('vi-VN')}*

---

## 1. Định nghĩa Cốt lõi
${concept.coreDefinition}

## 2. Giải thích Bản chất
${concept.explanation}

${concept.mechanism ? `
## 3. Cơ chế Hoạt động / Sinh lý bệnh
${concept.mechanism}
` : ''}

${concept.clinicalOrRealWorld ? `
## 4. Ứng dụng Thực tiễn / Lâm sàng
${concept.clinicalOrRealWorld}
` : ''}

${concept.analogies && concept.analogies.length > 0 ? `
## 5. Phép Loại suy & Ẩn dụ
${concept.analogies.map((a) => `- 💡 ${a}`).join('\n')}
` : ''}

${concept.comparisonTable && concept.comparisonTable.length > 0 ? `
## 6. Bảng So sánh Đối chiếu
| Tiêu chí | ${concept.topic} | Khái niệm liên quan |
| :--- | :--- | :--- |
${concept.comparisonTable.map((row) => `| ${row.feature} | ${row.thisConcept} | ${row.relatedConcept} |`).join('\n')}
` : ''}

## 7. Kiến thức Cốt lõi Cần Nhớ
${concept.keyTakeaways.map((t, i) => `${i + 1}. ${t}`).join('\n')}

${concept.commonMistakes && concept.commonMistakes.length > 0 ? `
## 8. Lỗi Thường gặp & Lưu ý
${concept.commonMistakes.map((m) => `- ⚠️ ${m}`).join('\n')}
` : ''}

## 9. Câu hỏi Kiểm tra Mức độ Hiểu bài
${concept.checkQuestions.map((q, i) => `Q${i + 1}: ${q}`).join('\n')}

---
*Biên soạn bởi StudyMate AI — Trợ lý Học tập Cá nhân hóa*
`;
}

export function formatQuizToMarkdown(quiz: Quiz): string {
  return `# ${quiz.title}
*Môn học: ${quiz.subject} | Độ khó: ${quiz.difficulty} | Dạng câu hỏi: ${quiz.questionType}*
*Thời gian làm bài: ${quiz.timeLimitMinutes || 15} phút | Tổng số câu: ${quiz.questions.length}*

---

${quiz.questions.map((q, index) => `
### Câu hỏi ${index + 1}:
${q.question}

${q.options.map((opt) => `- ${opt}`).join('\n')}

**Đáp án đúng:** Phương án ${['A', 'B', 'C', 'D'][q.correctAnswerIndex]}
**Giải thích chi tiết:**
${q.explanation}

**Phân tích từng phương án:**
${q.optionExplanations.map((exp, i) => `  - [${['A', 'B', 'C', 'D'][i]}]: ${exp}`).join('\n')}
`).join('\n---\n')}

---
*Biên soạn bởi StudyMate AI — Trợ lý Học tập Cá nhân hóa*
`;
}

export function formatPlanToMarkdown(tasks: StudyTask[], planTitle = 'Kế hoạch Ôn tập'): string {
  return `# ${planTitle}
*Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}*

---

## Danh sách Nhiệm vụ Học tập:
${tasks.map((t, i) => `
### ${i + 1}. [${t.status === 'completed' ? 'X' : ' '}] ${t.title}
- **Môn học:** ${t.subject}
- **Thời lượng:** ${t.estimatedDurationMinutes} phút
- **Phương pháp:** ${t.studyMethod || 'Spaced Repetition'}
- **Hạn hoàn thành:** ${t.scheduledDate}
- **Độ ưu tiên:** ${t.priority.toUpperCase()}
- **Mô tả:** ${t.description}
${t.reviewInterval ? `- **Nhịp lặp:** ${t.reviewInterval}` : ''}
`).join('\n')}

---
*Biên soạn bởi StudyMate AI — Trợ lý Học tập Cá nhân hóa*
`;
}

export function downloadFile(filename: string, content: string, mimeType = 'text/markdown') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function triggerPrint() {
  window.print();
}

// Convenient aliases for different call sites
export const exportSummaryToMarkdown = formatSummaryToMarkdown;
export const exportConceptToMarkdown = formatConceptToMarkdown;
export const exportQuizToMarkdown = formatQuizToMarkdown;
export const exportPlanToMarkdown = formatPlanToMarkdown;
export const exportContentAsFile = downloadFile;
export function printContent(content: string, title?: string) {
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>${title || 'StudyMate AI Tài liệu'}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; padding: 2rem; color: #1e293b; }
            h1, h2, h3 { color: #0f172a; margin-top: 1.5rem; }
            pre { background: #f1f5f9; padding: 1rem; border-radius: 8px; white-space: pre-wrap; }
            hr { border: 0; border-top: 1px solid #cbd5e1; margin: 1.5rem 0; }
          </style>
        </head>
        <body>
          <pre>${content}</pre>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  } else {
    window.print();
  }
}

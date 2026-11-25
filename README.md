# StudyMate AI

Ứng dụng hỗ trợ học tập y khoa cho sinh viên (tóm tắt, giải thích khái niệm, quiz, lộ trình ôn tập, notebook RAG, chatbot học thuật). 

> **An toàn y khoa:** Nội dung AI chỉ phục vụ mục đích giáo dục. Không thay thế chẩn đoán, kê đơn, điều trị hoặc tư vấn y tế cá nhân. Mọi thông tin cần được kiểm chứng với nguồn/tài liệu chính thống và người có chuyên môn.

## Chạy local

**Yêu cầu:** Node.js 20+

1. Cài dependencies:
   ```bash
   npm install
   ```
2. Tạo file env từ mẫu:
   ```bash
   cp .env.example .env.local
   ```
3. Điền biến môi trường tối thiểu:
   - `GEMINI_API_KEY`: key Gemini phía server (bắt buộc cho AI).
   - `VITE_FIREBASE_*`: cấu hình Firebase client nếu dùng Google Drive sync.
4. Chạy app:
   ```bash
   npm run dev
   ```

## Kiểm tra

```bash
npm run lint    # TypeScript typecheck
npm run build   # Production build
```

## Biến môi trường

Xem [.env.example](/.env.example). Lưu ý:
- **Không** đặt Gemini key dưới dạng `VITE_*` hoặc nhúng ở frontend.
- `CORS_ORIGIN`: danh sách origin được phép, phân tách dấu phẩy, dùng khi frontend/backend khác origin.
- `TRUST_PROXY=true` khi chạy sau reverse proxy/load balancer để rate limit nhận đúng IP.

## Deploy

Ứng dụng gồm frontend Vite + Express API (`/api/*`) trong [server.ts](/server.ts). Vì vậy **không nên deploy như static-only GitHub Pages** nếu cần các tính năng AI.

- **Khuyến nghị:** deploy Node server (Render/Railway/Fly/VM/Kubernetes) chạy `npm run build` rồi `npm start`/`npm run dev` theo môi trường.
- Workflow [.github/workflows/deploy.yml](/.github/workflows/deploy.yml) hiện build static Pages; chỉ phù hợp khi bạn đã tách/chuyển `/api/*` sang backend/serverless riêng và cấu hình CORS phù hợp.

## Trạng thái kỹ thuật / giới hạn hiện tại

- **Dữ liệu người dùng:** hiện lưu cục bộ `localStorage` ([storage.ts](/src/data/storage.ts)); đã có xuất/nhập/xóa sao lưu trong Cài đặt. Chưa có tài khoản, DB, đồng bộ đa thiết bị, RBAC.
- **RAG/citation:** notebook có citation nguồn + số trang khi có marker trang; đây là cải tiến heuristic, chưa phải pipeline RAG có chunk/index/page-bbox được xác minh hoàn toàn.
- **PDF bảng/hình ảnh:** trích xuất hiện dựa trên LLM/OCR nội bộ qua Gemini; bảng/hình phức tạp cần pipeline chuyên dụng (parser/OCR/table extractor) để đảm bảo độ chính xác.
- **Bảo mật:** có rate limit cơ bản in-memory, ẩn `x-powered-by`, CORS allowlist qua env, fallback lỗi AI. Chưa có authn/authz đầy đủ, audit log, rate limit phân tán, secret scanning/rotation tự động.
- **Đánh giá AI:** có scaffold mẫu tại [docs/ai-eval/README.md](/docs/ai-eval/README.md); cần chạy đánh giá với chuyên môn y khoa trước khi dùng thực tế.

## Đánh giá AI y khoa

Xem [docs/ai-eval/README.md](/docs/ai-eval/README.md) và [docs/ai-eval/golden-set.sample.json](/docs/ai-eval/golden-set.sample.json). Trước khi đưa cho sinh viên, cần kiểm thử độ chính xác, refusal an toàn, và chất lượng trích dẫn nguồn.

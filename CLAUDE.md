# YEG Financial Model – Web Dashboard

Web dashboard tài chính xây dựng từ file `YEG.xlsx`, chạy trực tiếp trên trình duyệt (không cần server).

## Cấu trúc project

```
financial_model/
  index.html   – Shell HTML, load 4 file JS theo thứ tự: data → model → render → app
  data.js      – Dữ liệu trích xuất từ YEG.xlsx (auto-generated, KHÔNG sửa tay)
  model.js     – compute() → trả về object r chứa tất cả chỉ số
  render.js    – Hàm render từng tab: renderCover, renderIS, renderBS, renderCF,
                 renderRatios, renderDCF, renderAssumptions
  app.js       – Entry point: showTab(), window.onload
  style.css    – Toàn bộ CSS
YEG.xlsx       – File Excel gốc (nguồn dữ liệu)
```

## Dữ liệu

- **Đơn vị:** tỷ VND (raw VND / 1e9)
- **Năm:** 2021–2024A (4 năm thực tế) + 2025–2031E (7 năm dự báo) = 11 năm
- **Hằng số:** `NH=4` (historical), `NF=7` (forecast), `N=11` (total), định nghĩa trong `model.js`
- **HIST_YRS / FCST_YRS / ALL_YRS:** mảng nhãn năm, định nghĩa trong `model.js`

## Tái tạo data.js

Khi `YEG.xlsx` thay đổi, chạy lại script extraction trong `model.js` bằng Node.js:

```bash
node -e "..." # xem lịch sử câu lệnh trong terminal
```

Hoặc yêu cầu Claude chạy lại extraction từ YEG.xlsx.

## Các tab

| Tab ID         | Hàm render         | Nội dung                              |
|----------------|--------------------|---------------------------------------|
| `cover`        | `renderCover`      | Dashboard: KPI tiles, bảng tóm tắt, 6 charts |
| `assumptions`  | `renderAssumptions`| Tổng quan công ty + thông số định giá |
| `is`           | `renderIS`         | Kết quả kinh doanh (Income Statement) |
| `bs`           | `renderBS`         | Bảng cân đối kế toán (Balance Sheet)  |
| `cf`           | `renderCF`         | Lưu chuyển tiền tệ (Cash Flow)        |
| `ratios`       | `renderRatios`     | 15+ chỉ số tài chính                  |
| `dcf`          | `renderDCF`        | Định giá DCF: scenario, calculator, heatmap, tornado |

## DCF Calculator

- Hàm `calcDCF(rf, beta, erp, kd, tax, dde, g, fcffMult)` trong `render.js`
- Tính lại real-time khi kéo slider
- `loadScenario(idx)`: tải Bear(0)/Base(1)/Bull(2) vào calculator
- Giá xác nhận: Bear 19,925₫ · Base 27,598₫ · Bull 54,005₫

## Thư viện bên ngoài (CDN)

- Chart.js 4.4.0
- Google Fonts – Inter

## Yêu cầu thường gặp

- **Thêm chỉ số mới:** thêm vào `compute()` trong `model.js`, sau đó dùng trong `render.js`
- **Đổi màu/style:** sửa `style.css`
- **Thêm tab mới:** thêm button vào `index.html`, thêm `div#tab-xxx`, thêm `case 'xxx'` trong `app.js`
- **Cập nhật dữ liệu:** chạy lại extraction script để tái tạo `data.js`

import React from "react";

const BORDER_COLOR = "#000000";

const CELL_BASE: React.CSSProperties = {
  border: `1px solid ${BORDER_COLOR}`,
  fontSize: "12px",
  lineHeight: "1.6",
  padding: "8px 4px",
  boxSizing: "border-box",
};

const CELL_HEADER: React.CSSProperties = {
  ...CELL_BASE,
  backgroundColor: "#f2f2f2",
  textAlign: "center",
  fontWeight: "bold",
  verticalAlign: "middle",
};

const CELL_BODY: React.CSSProperties = {
  ...CELL_BASE,
  verticalAlign: "middle",
};

const CELL_CENTER: React.CSSProperties = {
  ...CELL_BODY,
  textAlign: "center",
};

const TITLE: Record<"Sale" | "Receive", string> = {
  Sale:    "ប័ណ្ណស្នើបើកគ្រឿងបន្លាស់",
  Receive: "ប័ណ្ណស្នើបញ្ចូលគ្រឿងបន្លាស់",
};

const TransactionTemplate = ({ transaction }: {
  transaction: {
    transaction_type: "Sale" | "Receive";
    items: { barcode: string; product_name: string; unit?: string; quantity: number }[];
  };
}) => {
  const title = TITLE[transaction.transaction_type];
  return (
    <div
      id="invoice-receipt"
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "24mm 18mm",
        backgroundColor: "#ffffff",
        color: "#000000",
        fontFamily: "var(--font-kantumruy, 'KantumruyPro', sans-serif)",
        boxSizing: "border-box",
        margin: "auto",
      }}
    >
      {/* Header Section */}
      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "bold", margin: "0 0 8px 0" }}>
          {title}
        </h1>
        <p style={{ fontSize: "14px", margin: 0 }}>
          ថ្ងៃទី....... ខែ....... ឆ្នាំ ........
        </p>
      </div>

      {/* Table Section */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          tableLayout: "fixed",
        }}
      >
        <thead>
          <tr>
            <th style={{ ...CELL_HEADER, width: "35px" }}>ល.រ</th>
            <th style={{ ...CELL_HEADER, width: "22%" }}>លេខកូដ</th>
            <th style={{ ...CELL_HEADER }}>បរិយាយមុខទំនិញ</th>
            <th style={{ ...CELL_HEADER, width: "12%" }}>ឯកតា</th>
            <th style={{ ...CELL_HEADER, width: "12%" }}>បរិមាណ</th>
            <th style={{ ...CELL_HEADER, width: "15%" }}>ផ្សេងៗ</th>
          </tr>
        </thead>
        <tbody>
          {transaction.items.map((item, index) => (
            <tr key={`${index}-${item.barcode}`}>
              <td style={CELL_CENTER}>{index + 1}</td>
              <td style={{ ...CELL_BODY, paddingLeft: "8px" }}>{item.barcode}</td>
              <td style={{ ...CELL_BODY, paddingLeft: "8px" }}>{item.product_name}</td>
              <td style={CELL_CENTER}>{item.unit ?? "Pcs"}</td>
              <td style={CELL_CENTER}>{Math.abs(item.quantity)}</td>
              <td style={CELL_BODY}></td>
            </tr>
          ))}
          {transaction.items.length < 5 && Array.from({ length: 5 - transaction.items.length }).map((_, i) => (
            <tr key={`empty-${transaction.items.length}-${i}`}> 
              <td style={{ ...CELL_BODY, height: "32px" }}>&nbsp;</td>
              <td style={CELL_BODY}></td>
              <td style={CELL_BODY}></td>
              <td style={CELL_BODY}></td>
              <td style={CELL_BODY}></td>
              <td style={CELL_BODY}></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer Section — signature blocks */}
      <div style={{ display: "flex", justifyContent: "space-evenly", marginTop: "60px", padding: "0 20px" }}>
        {(["ផ្នែកជាង", "ប្រធានឃ្លាំង"] as const).map((label) => (
          <div key={label} style={{ textAlign: "center", width: "120px" }}>
            <p style={{ fontSize: "13px", fontWeight: "bold", margin: "0 0 60px 0" }}>{label}</p>
            <div style={{ borderBottom: "1px solid black", width: "100%" }} />
            <p style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>ហត្ថលេខា</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionTemplate;

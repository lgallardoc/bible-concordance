import { Handle, Position } from "reactflow";

const styles = {
  verse: {
    background: "linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)",
    color: "#fff",
    border: "3px solid #3730a3",
    borderRadius: "10px",
    padding: "12px 16px",
    minWidth: "180px",
    boxShadow: "0 4px 12px rgba(79,70,229,0.4)",
    cursor: "pointer",
    textAlign: "center" as const,
  },
  strongs: {
    background: "linear-gradient(135deg, #0891b2 0%, #0e7490 100%)",
    color: "#fff",
    border: "2px solid #0c4a6e",
    borderRadius: "8px",
    padding: "8px 14px",
    minWidth: "150px",
    cursor: "pointer",
    textAlign: "center" as const,
  },
  concordance: {
    background: "#f0fdf4",
    color: "#15803d",
    border: "2px dashed #22c55e",
    borderRadius: "8px",
    padding: "8px 12px",
    minWidth: "160px",
    cursor: "pointer",
    textAlign: "center" as const,
  },
};

export function VersNode({ data }: { data: any }) {
  return (
    <div style={styles.verse}>
      <div style={{ fontSize: "11px", opacity: 0.8, marginBottom: "4px" }}>📖 Versículo</div>
      <div style={{ fontSize: "13px", fontWeight: "bold" }}>{data.label}</div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export function StrongsNode({ data }: { data: any }) {
  return (
    <div style={styles.strongs}>
      <div style={{ fontSize: "10px", opacity: 0.75, marginBottom: "2px" }}>♡ {data.code}</div>
      <div style={{ fontSize: "13px", fontWeight: "bold" }}>{data.label}</div>
      {data.count != null && (
        <div style={{ fontSize: "10px", marginTop: "4px", opacity: 0.8 }}>
          {data.count} concordancias
        </div>
      )}
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export function ConcordanceNode({ data }: { data: any }) {
  return (
    <div style={styles.concordance}>
      <div style={{ fontSize: "11px", fontWeight: "bold", marginBottom: "3px" }}>
        {data.reference}
      </div>
      {data.excerpt && (
        <div style={{ fontSize: "10px", opacity: 0.75, maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {data.excerpt}
        </div>
      )}
      <Handle type="target" position={Position.Left} />
    </div>
  );
}

export function CustomNode(props: any) {
  const { data } = props;
  const type = data.nodeType;
  if (type === "verse") return <VersNode data={data} />;
  if (type === "strongs") return <StrongsNode data={data} />;
  if (type === "concordance") return <ConcordanceNode data={data} />;
  return (
    <div style={{ background: "#fee2e2", border: "1px solid #ef4444", padding: "8px", borderRadius: "6px", fontSize: "11px" }}>
      {data.label || "Nodo desconocido"}
    </div>
  );
}

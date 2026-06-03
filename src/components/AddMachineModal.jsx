import { useMemo, useState } from "react";
import { defaultMachines } from "../lib/personas";

export default function AddMachineModal({
  group,
  onAdd,
  onClose,
  existingMachines = [],
  theme,
  allSessions = [],
}) {
  const T = theme;
  const [custom, setCustom] = useState("");

  const normalize = (value) =>
    String(value || "")
      .trim()
      .toLowerCase();

  const usedMachines = useMemo(() => {
    return [
      ...new Set(
        (allSessions || [])
          .flatMap((session) => [
            ...(session.lower || []),
            ...(session.upper || []),
          ])
          .map((exercise) => exercise.machine)
          .filter(Boolean)
      ),
    ];
  }, [allSessions]);

  const suggestions = useMemo(() => {
    const existing = new Set(existingMachines.map(normalize));
    const query = normalize(custom);

    const combined = [
      ...new Set([
        ...usedMachines,
        ...((defaultMachines && defaultMachines[group]) || []),
      ]),
    ].filter((machine) => !existing.has(normalize(machine)));

    if (!query) return combined.slice(0, 12);

    return combined
      .filter((machine) => normalize(machine).includes(query))
      .slice(0, 12);
  }, [custom, existingMachines, group, usedMachines]);

  const handleAdd = (machine) => {
    const cleanMachine = String(machine || "").trim();

    if (!cleanMachine) return;

    onAdd(cleanMachine);
  };

  const inputStyle = {
    flex: 1,
    background: T.inputBg,
    border: `1px solid ${T.inputBorder}`,
    borderRadius: "12px",
    color: T.text,
    fontSize: "14px",
    padding: "12px 14px",
    fontFamily: "'DM Sans',sans-serif",
    outline: "none",
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        zIndex: 100,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          background: T.modalBg,
          border: `1px solid ${T.bgCardBorder}`,
          borderRadius: "22px 22px 0 0",
          padding: "24px 20px 36px",
          width: "100%",
          maxWidth: "480px",
          maxHeight: "76vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "4px",
            background: `${T.accent}50`,
            borderRadius: "2px",
            margin: "0 auto 20px",
          }}
        />

        <p
          style={{
            color: T.textSub,
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "2px",
            marginBottom: "14px",
            fontFamily: "'DM Sans',sans-serif",
            fontWeight: 800,
          }}
        >
          Adicionar · {group === "lower" ? "Lower Body" : "Upper Body"}
        </p>

        <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
          <input
            placeholder="Digite ou escolha uma máquina..."
            value={custom}
            onChange={(event) => setCustom(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && custom.trim()) {
                event.preventDefault();
                event.stopPropagation();
                handleAdd(custom);
              }
            }}
            style={inputStyle}
          />

          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              handleAdd(custom);
            }}
            style={{
              background: T.accent,
              border: "none",
              borderRadius: "12px",
              color: T.accentText,
              fontWeight: 800,
              fontSize: "14px",
              padding: "0 16px",
              cursor: "pointer",
              fontFamily: "'DM Sans',sans-serif",
              opacity: custom.trim() ? 1 : 0.45,
            }}
          >
            +
          </button>
        </div>

        {suggestions.length > 0 ? (
          <>
            <p
              style={{
                color: T.textMuted,
                fontSize: "10px",
                marginBottom: "10px",
                fontFamily: "'DM Sans',sans-serif",
                fontWeight: 800,
                letterSpacing: "1.5px",
                textTransform: "uppercase",
              }}
            >
              Sugestões
            </p>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {suggestions.map((machine) => (
                <button
                  type="button"
                  key={machine}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    handleAdd(machine);
                  }}
                  style={{
                    background: T.bgCard,
                    border: `1px solid ${T.bgCardBorder}`,
                    borderRadius: "14px",
                    color: T.text,
                    fontSize: "13px",
                    fontWeight: 700,
                    padding: "12px 14px",
                    cursor: "pointer",
                    fontFamily: "'DM Sans',sans-serif",
                    textAlign: "left",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>{machine}</span>

                  {usedMachines.includes(machine) && (
                    <span
                      style={{
                        color: T.accent,
                        fontSize: "10px",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.8px",
                      }}
                    >
                      usado antes
                    </span>
                  )}
                </button>
              ))}
            </div>
          </>
        ) : (
          <p
            style={{
              color: T.textMuted,
              fontSize: "12px",
              fontFamily: "'DM Sans',sans-serif",
              textAlign: "center",
              padding: "16px 0",
            }}
          >
            Nenhuma sugestão encontrada.
          </p>
        )}
      </div>
    </div>
  );
}

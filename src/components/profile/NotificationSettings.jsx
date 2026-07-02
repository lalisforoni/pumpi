import { useState } from "react";
import {
  getNotificationSettings,
  saveNotificationSettings,
} from "../../lib/storage";

export default function NotificationSettings({ theme }) {
  const T = theme;

  const [settings, setSettings] = useState(
    getNotificationSettings()
  );

  const update = (changes) => {
    const next = {
      ...settings,
      ...changes,
    };

    setSettings(next);
    saveNotificationSettings(next);
  };

  const toggleDay = (day) => {
    const exists = settings.days.includes(day);

    const nextDays = exists
      ? settings.days.filter((d) => d !== day)
      : [...settings.days, day].sort();

    update({
      days: nextDays,
    });
  };

  const days = [
    { id: 1, short: "S", label: "Segunda" },
    { id: 2, short: "T", label: "Terça" },
    { id: 3, short: "Q", label: "Quarta" },
    { id: 4, short: "Q", label: "Quinta" },
    { id: 5, short: "S", label: "Sexta" },
    { id: 6, short: "S", label: "Sábado" },
    { id: 0, short: "D", label: "Domingo" },
  ];

  return (
    <div
      style={{
        background: T.bgCard,
        border: `1px solid ${T.bgCardBorder}`,
        borderRadius: "18px",
        padding: "18px",
        marginBottom: "16px",
      }}
    >
      <p
        style={{
          color: T.text,
          fontSize: "17px",
          fontWeight: 800,
          margin: "0 0 4px",
          fontFamily: "'DM Sans',sans-serif",
        }}
      >
        🔔 Lembretes
      </p>

      <p
        style={{
          color: T.textSub,
          fontSize: "12px",
          marginBottom: "18px",
          lineHeight: 1.5,
          fontFamily: "'DM Sans',sans-serif",
        }}
      >
        Configure quando o Pumpi deve lembrar você de treinar.
      </p>

      <Row
        label="Ativar lembretes"
        value={
          <Switch
            checked={settings.enabled}
            onChange={() =>
              update({
                enabled: !settings.enabled,
              })
            }
            theme={T}
          />
        }
      />

      <Row
        label="Horário"
        value={
          <input
            type="time"
            value={settings.hour}
            onChange={(e) =>
              update({
                hour: e.target.value,
              })
            }
            style={{
              background: T.inputBg,
              border: `1px solid ${T.inputBorder}`,
              color: T.text,
              borderRadius: "10px",
              padding: "8px 10px",
            }}
          />
        }
      />

      <div style={{ marginTop: "18px" }}>
        <p
          style={{
            color: T.text,
            fontSize: "13px",
            fontWeight: 700,
            marginBottom: "10px",
            fontFamily: "'DM Sans',sans-serif",
          }}
        >
          Dias de treino
        </p>

        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          {days.map((day) => {
            const active = settings.days.includes(day.id);

            return (
              <button
                key={day.id}
                onClick={() => toggleDay(day.id)}
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "12px",
                  border: `1px solid ${
                    active
                      ? T.accent
                      : T.bgCardBorder
                  }`,
                  background: active
                    ? T.accent
                    : T.bgCard,
                  color: active
                    ? T.accentText
                    : T.text,
                  fontWeight: 800,
                  cursor: "pointer",
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                {day.short}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: "18px" }}>
        <Check
          label="Lembrar caso eu não treine"
          checked={settings.remindIfNoWorkout}
          onChange={() =>
            update({
              remindIfNoWorkout:
                !settings.remindIfNoWorkout,
            })
          }
          theme={T}
        />

        <Check
          label="Avisar quando perder streak"
          checked={settings.streakReminder}
          onChange={() =>
            update({
              streakReminder:
                !settings.streakReminder,
            })
          }
          theme={T}
        />
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "14px",
      }}
    >
      <span>{label}</span>

      {value}
    </div>
  );
}

function Switch({
  checked,
  onChange,
  theme,
}) {
  return (
    <button
      onClick={onChange}
      style={{
        width: "48px",
        height: "28px",
        borderRadius: "999px",
        border: "none",
        cursor: "pointer",
        position: "relative",
        background: checked
          ? theme.accent
          : theme.bgCardBorder,
        transition: ".25s",
      }}
    >
      <div
        style={{
          width: "22px",
          height: "22px",
          borderRadius: "50%",
          background: "#fff",
          position: "absolute",
          top: "3px",
          left: checked ? "23px" : "3px",
          transition: ".25s",
        }}
      />
    </button>
  );
}

function Check({
  label,
  checked,
  onChange,
  theme,
}) {
  return (
    <button
      onClick={onChange}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: "8px 0",
        color: theme.text,
        textAlign: "left",
        fontFamily: "'DM Sans',sans-serif",
      }}
    >
      <div
        style={{
          width: "18px",
          height: "18px",
          borderRadius: "6px",
          border: `1px solid ${theme.accent}`,
          background: checked
            ? theme.accent
            : "transparent",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "11px",
        }}
      >
        {checked ? "✓" : ""}
      </div>

      {label}
    </button>
  );
}

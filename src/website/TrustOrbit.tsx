import { BadgeCheck } from "lucide-react";
import { type CSSProperties } from "react";

const TRUST_ITEMS = ["Private client data", "Deadline tracking", "Smart team updates"];

export function TrustOrbit() {
  return (
    <div className="trillo-trust-orbit" aria-label="OperionOS platform highlights">
      {TRUST_ITEMS.map((item, index) => (
        <span className="trust-orbit-item" key={item} style={{ "--trust-index": index } as CSSProperties}>
          <span className="trust-status-slot" aria-hidden="true">
            <i className="trust-dot" />
            <BadgeCheck className="trust-badge" size={26} />
          </span>
          <span className="trust-label">{item}</span>
        </span>
      ))}
    </div>
  );
}

type MarketingWebsiteProps = {
  onSignin: () => void;
  onSignup: () => void;
};

export function MarketingWebsite({ onSignin, onSignup }: MarketingWebsiteProps) {
  return (
    <iframe
      className="marketing-site-frame"
      src="/marketing/trillo.framer.ai/index.html"
      title="OperionOS marketing website"
      onLoad={(event) => {
        const frameWindow = event.currentTarget.contentWindow;
        const frameDocument = event.currentTarget.contentDocument;

        if (!frameWindow || !frameDocument) {
          return;
        }

        const handleClick = (clickEvent: MouseEvent) => {
          const target = clickEvent.target as HTMLElement | null;
          const actionTarget = target?.closest("a, button, [role='button']");

          if (!actionTarget) {
            return;
          }

          const label = actionTarget.textContent?.replace(/\s+/g, " ").trim().toLowerCase() ?? "";

          if (/\b(login|sign in)\b/.test(label)) {
            clickEvent.preventDefault();
            onSignin();
          }

          if (/\b(start free|sign up|create owner workspace)\b/.test(label)) {
            clickEvent.preventDefault();
            onSignup();
          }
        };

        frameDocument.addEventListener("click", handleClick, true);
      }}
    />
  );
}

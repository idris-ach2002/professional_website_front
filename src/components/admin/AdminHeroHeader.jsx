import { Button } from "@mantine/core";

export default function AdminHeroHeader({ controller, currentItem }) {
  const { loading, refreshOwners, handleLogout } = controller;

  return (
    <header className="admin-hero-card">
      <div className="admin-hero-copy">
        <span className="admin-mobile-brand">Portfolio OS</span>
        <span className="admin-breadcrumb">Workspace <i>/</i> {currentItem?.label}</span>
        <h1>{currentItem?.label ?? "Vue d’ensemble"}</h1>
        <p>{currentItem?.hint ?? "Pilotez votre portfolio sans friction."}</p>
      </div>
      <div className="admin-hero-actions">
        <Button onClick={() => refreshOwners()} loading={loading} variant="light">↻ <span>Synchroniser</span></Button>
        <Button component="a" href="/" variant="subtle">↗ <span>Site public</span></Button>
        <Button onClick={handleLogout} loading={loading} variant="outline" aria-label="Se déconnecter">⌁ <span>Quitter</span></Button>
      </div>
    </header>
  );
}

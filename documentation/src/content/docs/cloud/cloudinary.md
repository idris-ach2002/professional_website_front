---
title: Cloudinary
description: Stockage des médias, séparation des secrets et URLs publiques.
---
## Abstraction de stockage

Le backend dépend de `StorageService`, pas directement d’un chemin local ou de Cloudinary. `STORAGE_PROVIDER` sélectionne l’implémentation. Cette abstraction permet au code métier de demander un stockage ou une suppression sans connaître le fournisseur.

## Flux d’upload

1. L’administrateur envoie le fichier sur `/uploads/` avec une session valide.
2. Spring Security et les limites d’upload sont appliquées avant le stockage.
3. Le backend valide le fichier et délègue au provider configuré.
4. Cloudinary reçoit le média avec les credentials serveur.
5. Le backend renvoie une URL exploitable par les DTO.
6. Le frontend conserve uniquement l’URL publique ; aucun secret Cloudinary n’entre dans le bundle Vite.

<div class="architecture-frame">
  <img src="/diagrams/storage-flow.svg" alt="Flux d’upload du navigateur vers le provider de stockage." />
  <div class="architecture-caption">Le secret reste côté serveur ; l’UI ne reçoit que le résultat public.</div>
</div>

## Variables

`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` et `CLOUDINARY_FOLDER` appartiennent à l’environnement backend. Elles ne doivent pas être déclarées sous un préfixe `VITE_`.

## Mode local

Le provider local reste utile pour le développement et les tests. Les routes de fichiers et le répertoire `UPLOAD_DIR` conservent le même contrat fonctionnel, ce qui évite de coupler l’administration à un fournisseur cloud.

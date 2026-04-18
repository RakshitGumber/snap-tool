import { describe, expect, test } from "bun:test";

import {
  getBinaryRecordId,
  toStoredAssetMetaFromLegacy,
} from "./storage";

describe("upload storage helpers", () => {
  test("builds stable binary record ids", () => {
    expect(getBinaryRecordId("asset-1", "preview")).toBe("asset-1:preview");
    expect(getBinaryRecordId("asset-1", "full")).toBe("asset-1:full");
  });

  test("migrates legacy local assets to v2 metadata", () => {
    expect(
      toStoredAssetMetaFromLegacy({
        id: "asset-1",
        name: "Screenshot.png",
        source: "local-file",
        storageKind: "indexeddb-blob",
        width: 800,
        height: 600,
        addedAt: "2026-04-18T00:00:00.000Z",
        mimeType: "image/png",
        blob: new Blob(["abc"], { type: "image/png" }),
      }),
    ).toEqual({
      id: "asset-1",
      name: "Screenshot.png",
      source: "local-file",
      storageKind: "local-indexeddb",
      width: 800,
      height: 600,
      addedAt: "2026-04-18T00:00:00.000Z",
      mimeType: "image/png",
      originalUrl: undefined,
      previewUrl: null,
      remoteUrl: null,
    });
  });

  test("migrates legacy remote assets to v2 metadata", () => {
    expect(
      toStoredAssetMetaFromLegacy({
        id: "asset-2",
        name: "Preview",
        source: "github",
        storageKind: "remote-url",
        width: 1200,
        height: 630,
        addedAt: "2026-04-18T00:00:00.000Z",
        src: "https://example.com/full.png",
        thumbnailSrc: "https://example.com/thumb.png",
        originalUrl: "https://github.com/openai/openai",
      }),
    ).toEqual({
      id: "asset-2",
      name: "Preview",
      source: "github",
      storageKind: "remote-url",
      width: 1200,
      height: 630,
      addedAt: "2026-04-18T00:00:00.000Z",
      mimeType: undefined,
      originalUrl: "https://github.com/openai/openai",
      previewUrl: "https://example.com/thumb.png",
      remoteUrl: "https://example.com/full.png",
    });
  });
});

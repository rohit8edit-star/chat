export const uploadFile = async (
  file: File | Blob,
  filename: string,
): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file, filename);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("File upload failed");
  }

  const data = await res.json();
  return data.url;
};

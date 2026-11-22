/**
 * Shrinks a photo in the browser before it's uploaded: a phone camera shot is
 * several megabytes, which is slow on mobile data and well over the server's
 * request size limit. Re-encoded as JPEG, at most `maxSide` pixels on its long
 * side. Anything that can't be decoded (or a browser without the APIs) is
 * returned untouched, and the server-side limits still apply to it.
 */
export async function downscaleImage(file: File, maxSide = 1280, quality = 0.82): Promise<File> {
	// animated GIFs would lose their animation
	if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;
	if (typeof createImageBitmap !== 'function') return file;

	try {
		// honours the EXIF rotation of phone photos
		const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
		const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
		const small = file.size < 400 * 1024 && ['image/jpeg', 'image/webp'].includes(file.type);
		if (scale === 1 && small) {
			bitmap.close();
			return file;
		}

		const canvas = document.createElement('canvas');
		canvas.width = Math.max(1, Math.round(bitmap.width * scale));
		canvas.height = Math.max(1, Math.round(bitmap.height * scale));
		const context = canvas.getContext('2d');
		if (!context) {
			bitmap.close();
			return file;
		}
		// JPEG has no transparency: transparent PNG areas would turn black
		context.fillStyle = '#ffffff';
		context.fillRect(0, 0, canvas.width, canvas.height);
		context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
		bitmap.close();

		const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
		if (!blob || blob.size >= file.size) return file;
		const name = `${file.name.replace(/\.[^.]*$/, '') || 'photo'}.jpg`;
		return new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() });
	} catch {
		return file;
	}
}

/** Puts `file` into a file input, so the regular form submission sends it. Returns false if unsupported. */
export function setInputFile(input: HTMLInputElement, file: File): boolean {
	try {
		const transfer = new DataTransfer();
		transfer.items.add(file);
		input.files = transfer.files;
		return true;
	} catch {
		return false;
	}
}

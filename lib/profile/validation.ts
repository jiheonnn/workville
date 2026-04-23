const USERNAME_REGEX = /^[A-Za-z0-9가-힣]+$/

export function sanitizeUsername(value: string) {
  return value.trim()
}

export function validateUsername(
  value: string
): { ok: true } | { ok: false; error: string } {
  const sanitizedValue = sanitizeUsername(value)

  if (!sanitizedValue) {
    return {
      ok: false,
      error: '이름을 입력해주세요.',
    }
  }

  if (sanitizedValue.length < 2 || sanitizedValue.length > 12) {
    return {
      ok: false,
      error: '이름은 2자 이상 12자 이하여야 합니다.',
    }
  }

  if (!USERNAME_REGEX.test(sanitizedValue)) {
    return {
      ok: false,
      error: '이름은 한글, 영문, 숫자만 사용할 수 있습니다.',
    }
  }

  return { ok: true }
}

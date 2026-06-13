const CLOUD_NAME = 'dyesveyof';

const IMAGE_MAP = {
  ai: `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/thesis/ai.jpg`,
  networking: `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/thesis/networking.jpg`,
  'computer-networks': `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/thesis/networking.jpg`,
  is: `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/thesis/is.jpg`,
  'information-systems': `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/thesis/is.jpg`,
  security: `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/thesis/security.jpg`,
  cybersecurity: `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/thesis/security.jpg`,
  'software-engineering': `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/thesis/software-engineering.jpg`,
  programming: `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/thesis/programming.jpg`
};

const LABEL_MAP = {
  'trí tuệ nhân tạo': 'ai',
  'mạng máy tính': 'networking',
  'hệ thống thông tin dn': 'is',
  'hệ thống thông tin': 'is',
  'an toàn không gian mạng': 'security',
  'công nghệ phần mềm': 'software-engineering',
  'kỹ thuật lập trình': 'programming'
};

export const getMajorDefaultImage = (majorOrName) => {
  if (!majorOrName) {
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/thesis/general.jpg`; // fallback
  }

  const cleanKey = majorOrName.trim().toLowerCase();

  // 1. Direct key match
  if (IMAGE_MAP[cleanKey]) {
    return IMAGE_MAP[cleanKey];
  }

  // 2. Label mapping match
  const mappedKey = LABEL_MAP[cleanKey];
  if (mappedKey && IMAGE_MAP[mappedKey]) {
    return IMAGE_MAP[mappedKey];
  }

  // 3. Fallback
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/thesis/general.jpg`;
};

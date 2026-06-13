const CLOUD_NAME = 'dyesveyof';

const CANONICAL_MAP = {
  ai: 'ai',
  networking: 'networking',
  'computer-networks': 'networking',
  is: 'is',
  'information-systems': 'is',
  security: 'security',
  cybersecurity: 'security',
  'software-engineering': 'software-engineering',
  programming: 'programming'
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

const getHash = (str) => {
  let hash = 0;
  if (!str) return hash;
  const s = String(str);
  for (let i = 0; i < s.length; i++) {
    const char = s.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

export const getMajorDefaultImage = (majorOrName, seedId) => {
  let canonicalKey = 'general';

  if (majorOrName) {
    const cleanKey = majorOrName.trim().toLowerCase();
    
    // 1. Direct label mapping
    if (LABEL_MAP[cleanKey]) {
      canonicalKey = LABEL_MAP[cleanKey];
    }
    // 2. Direct canonical mapping
    else if (CANONICAL_MAP[cleanKey]) {
      canonicalKey = CANONICAL_MAP[cleanKey];
    }
  }

  // Calculate index based on seedId
  let index = 1;
  if (seedId !== undefined && seedId !== null && seedId !== '') {
    const hash = getHash(seedId);
    index = (Math.abs(hash) % 3) + 1;
  }

  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/thesis/${canonicalKey}_${index}.jpg`;
};

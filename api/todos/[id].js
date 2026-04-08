import { MongoClient, ObjectId } from 'mongodb';

let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Please define the MONGODB_URI environment variable inside Vercel');
  }
  const client = new MongoClient(uri);
  await client.connect();
  cachedClient = client;
  return client;
}

function normalizeCategory(category) {
  if (category === 'shopping' || category === 'schedule' || category === 'other') {
    return category;
  }
  return 'other';
}

function extractDateLabel(displayTime) {
  if (!displayTime) return '';
  return displayTime.replace(/\s*\d{1,2}:\d{2}\s*$/, '').trim();
}

function serializeTodo(doc) {
  return {
    ...doc,
    _id: doc._id.toString(),
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-User-Id'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ success: false, error: '缺少 X-User-Id 请求头' });
  }

  const idParam = req.query.id;
  if (!idParam || !/^[0-9a-fA-F]{24}$/.test(idParam)) {
    return res.status(404).json({ success: false, error: '缺少有效的 _id 参数' });
  }

  try {
    const client = await connectToDatabase();
    const db = client.db('todoDB');
    const collection = db.collection('todos');
    const _id = new ObjectId(idParam);

    if (req.method === 'PATCH' || req.method === 'PUT') {
      const body = req.body || {};
      const updates = {};

      if ('content' in body) {
        const content = String(body.content || '').trim();
        if (!content) {
          return res.status(400).json({ success: false, error: 'content 不能为空' });
        }
        updates.content = content;
      }

      if ('category' in body) {
        updates.category = normalizeCategory(body.category);
      }

      if ('time' in body) {
        updates.time = body.time || null;
      }

      if ('displayTime' in body) {
        updates.displayTime = body.displayTime || null;
      }

      if ('dateLabel' in body) {
        updates.dateLabel = body.dateLabel || extractDateLabel(body.displayTime);
      } else if ('displayTime' in body) {
        updates.dateLabel = extractDateLabel(body.displayTime);
      }

      if ('isCompleted' in body) {
        updates.isCompleted = Boolean(body.isCompleted);
      }

      updates.updatedAt = new Date().toISOString();

      const result = await collection.findOneAndUpdate(
        { _id, userId },
        { $set: updates },
        { returnDocument: 'after' }
      );

      if (!result) {
        return res.status(404).json({ success: false, error: '事项不存在' });
      }

      return res.status(200).json({ success: true, data: serializeTodo(result) });
    }

    if (req.method === 'DELETE') {
      const result = await collection.deleteOne({ _id, userId });
      if (!result.deletedCount) {
        return res.status(404).json({ success: false, error: '事项不存在' });
      }
      return res.status(200).json({ success: true, data: true });
    }

    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  } catch (error) {
    console.error('MongoDB Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

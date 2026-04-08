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
  // 设置 CORS 头，允许 Cloudflare Worker 和任意客户端访问
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

  try {
    const client = await connectToDatabase();
    const db = client.db('todoDB');
    const collection = db.collection('todos');

    // 解析出 ID (如果是 /api/todos/:id 的形式)
    // 注意：req.url 会是 /api/todos 或 /api/todos/64f1a2...
    const urlParts = req.url.split('?')[0].split('/').filter(Boolean);
    const lastPart = urlParts[urlParts.length - 1];
    
    // 如果最后一段是 24 位 16 进制字符串，我们认为是 ID
    let _id = null;
    if (lastPart && lastPart.length === 24 && /^[0-9a-fA-F]{24}$/.test(lastPart)) {
      _id = new ObjectId(lastPart);
    }

    // GET: 获取所有事项
    if (req.method === 'GET' && !_id) {
      const todos = await collection
        .find({ userId })
        .sort({ isCompleted: 1, createdAt: -1 })
        .toArray();
      return res.status(200).json({ success: true, data: todos.map(serializeTodo) });
    }

    // POST: 添加事项
    if (req.method === 'POST' && !_id) {
      const body = req.body;
      if (!body || !String(body.content || '').trim()) {
        return res.status(400).json({ success: false, error: 'content 不能为空' });
      }

      const now = new Date().toISOString();
      const displayTime = body.displayTime || null;
      const todo = {
        userId,
        content: String(body.content).trim(),
        category: normalizeCategory(body.category),
        time: body.time || null,
        displayTime,
        dateLabel: body.dateLabel || extractDateLabel(displayTime),
        isCompleted: false,
        createdAt: now,
        updatedAt: now,
      };

      const result = await collection.insertOne(todo);
      return res.status(201).json({
        success: true,
        data: { ...todo, _id: result.insertedId.toString() },
      });
    }

    // -----------------------------------------------------
    // 需要 _id 的操作 (PUT/PATCH/DELETE)
    // -----------------------------------------------------
    if (!_id) {
       return res.status(404).json({ success: false, error: '缺少有效的 _id 参数' });
    }

    // PUT/PATCH: 更新事项
    if (req.method === 'PUT' || req.method === 'PATCH') {
      const body = req.body;
      const updates = {};

      if ('content' in body) {
        const content = String(body.content || '').trim();
        if (!content) return res.status(400).json({ success: false, error: 'content 不能为空' });
        updates.content = content;
      }
      if ('category' in body) updates.category = normalizeCategory(body.category);
      if ('time' in body) updates.time = body.time || null;
      if ('displayTime' in body) updates.displayTime = body.displayTime || null;
      
      if ('dateLabel' in body) {
        updates.dateLabel = body.dateLabel || extractDateLabel(body.displayTime);
      } else if ('displayTime' in body) {
        updates.dateLabel = extractDateLabel(body.displayTime);
      }

      if ('isCompleted' in body) updates.isCompleted = Boolean(body.isCompleted);

      updates.updatedAt = new Date().toISOString();

      const result = await collection.findOneAndUpdate(
        { _id, userId },
        { $set: updates },
        { returnDocument: 'after' }
      );

      if (!result) return res.status(404).json({ success: false, error: '事项不存在' });
      return res.status(200).json({ success: true, data: serializeTodo(result) });
    }

    // DELETE: 删除事项
    if (req.method === 'DELETE') {
      const result = await collection.deleteOne({ _id, userId });
      if (!result.deletedCount) return res.status(404).json({ success: false, error: '事项不存在' });
      return res.status(200).json({ success: true, data: true });
    }

    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  } catch (error) {
    console.error('MongoDB Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
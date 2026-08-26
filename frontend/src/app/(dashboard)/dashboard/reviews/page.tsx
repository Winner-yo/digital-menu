'use client';
import { useEffect, useState } from 'react';
import { reviewApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/Input';
import { formatDate } from '@/lib/utils';
import type { Review } from '@/types';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reply, setReply] = useState<Record<string, string>>({});

  const load = () => {
    reviewApi.getAll({ limit: 50 }).then((r) => setReviews(r.data.data || [])).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Reviews</h1>
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="bg-white rounded-2xl shadow-card p-5">
            <div className="flex justify-between">
              <p className="font-semibold">{review.customer?.name || 'Guest'} · {'★'.repeat(review.rating)}</p>
              <p className="text-xs text-gray-400">{formatDate(review.createdAt)}</p>
            </div>
            <p className="text-sm text-gray-600 mt-2">{review.comment || 'No comment'}</p>
            {review.menuItem && <p className="text-xs text-gray-400 mt-1">Item: {review.menuItem.name}</p>}
            {review.ownerReply && <p className="mt-2 text-sm bg-gray-50 rounded-lg p-2">Reply: {review.ownerReply}</p>}
            {!review.ownerReply && (
              <div className="mt-3 space-y-2">
                <TextArea value={reply[review.id] || ''} onChange={(e) => setReply({ ...reply, [review.id]: e.target.value })} placeholder="Write a reply" fullWidth />
                <Button size="sm" onClick={() => reviewApi.reply(review.id, reply[review.id]).then(load)}>Reply</Button>
              </div>
            )}
          </div>
        ))}
        {reviews.length === 0 && <p className="text-gray-500">No reviews yet.</p>}
      </div>
    </div>
  );
}

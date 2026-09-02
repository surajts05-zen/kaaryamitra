import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calendar, User, Users } from 'lucide-react';
import { format } from 'date-fns';

export function EssMyReviewsPage() {
  const { slug } = useParams();

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['ess-my-reviews', slug],
    queryFn: async () => {
      const res = await apiClient.get(`/t/${slug}/me/performance/reviews`);
      return res.data.data;
    },
    enabled: !!slug
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_SELF_REVIEW': return <Badge variant="outline" className="text-amber-500 bg-amber-50">Self-Review Pending</Badge>;
      case 'PENDING_PEER_REVIEW': return <Badge variant="outline" className="text-blue-500 bg-blue-50">Peer Reviews Pending</Badge>;
      case 'PENDING_MANAGER_REVIEW': return <Badge variant="outline" className="text-purple-500 bg-purple-50">Manager Review Pending</Badge>;
      case 'COMPLETED': return <Badge className="bg-green-500">Completed</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">My Performance Reviews</h2>
        <p className="text-muted-foreground">Complete your self-assessments and view manager feedback.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">Loading reviews...</div>
      ) : reviews?.length === 0 ? (
        <Card className="border-dashed shadow-none bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">No active reviews</h3>
            <p className="text-muted-foreground max-w-sm mt-2">You don't have any pending performance reviews or past evaluations to display at this time.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reviews?.map((review: any) => (
            <Card key={review.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline">{review.cycle.type}</Badge>
                  {getStatusBadge(review.status)}
                </div>
                <CardTitle className="text-lg">{review.cycle.title}</CardTitle>
                <CardDescription className="flex items-center mt-2">
                  <Calendar className="mr-1 h-3 w-3" />
                  {format(new Date(review.cycle.startDate), 'MMM d')} - {format(new Date(review.cycle.endDate), 'MMM d, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 pb-4">
                <div className="text-sm space-y-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground flex items-center"><User className="mr-2 h-4 w-4" /> Manager</span>
                    <span className="font-medium">{review.manager.firstName} {review.manager.lastName}</span>
                  </div>
                  
                  {review.cycle.is360Degree && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground flex items-center"><Users className="mr-2 h-4 w-4" /> Peer Feedback</span>
                      <span className="font-medium">{review._count?.feedback} / {review.peerReviewers?.length || 0} submitted</span>
                    </div>
                  )}

                  {review.status === 'COMPLETED' && (
                    <div className="pt-2">
                      <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Final Rating</span>
                      <div className="text-xl font-bold">{review.managerRating} <span className="text-sm font-normal text-muted-foreground">/ 5</span></div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-0 border-t mt-auto px-6 py-4 bg-muted/20">
                <Button variant={review.status === 'PENDING_SELF_REVIEW' ? 'default' : 'outline'} className="w-full" asChild>
                  <Link to={review.id}>
                    {review.status === 'PENDING_SELF_REVIEW' ? 'Start Self-Assessment' : 'View Details'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

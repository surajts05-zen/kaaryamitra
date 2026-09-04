import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';

export function EssMyReviewsPage() {
  const { slug } = useParams();

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['ess-my-reviews', slug],
    queryFn: async () => {
      const res = await apiClient.get(`/t/${slug}/performance/me/reviews`);
      return res.data.data;
    },
    enabled: !!slug
  });

  // Status values match the ReviewStatus enum in the schema
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NOT_STARTED':      return <Badge variant="secondary">Not Started</Badge>;
      case 'SELF_EVALUATION':  return <Badge variant="outline" className="text-amber-500 bg-amber-50">Self-Evaluation Pending</Badge>;
      case 'MANAGER_EVALUATION': return <Badge variant="outline" className="text-purple-500 bg-purple-50">Manager Review Pending</Badge>;
      case 'PEER_EVALUATION':  return <Badge variant="outline" className="text-blue-500 bg-blue-50">Peer Reviews Pending</Badge>;
      case 'HR_REVIEW':        return <Badge variant="outline" className="text-indigo-500 bg-indigo-50">HR Review</Badge>;
      case 'COMPLETED':        return <Badge className="bg-green-500">Completed</Badge>;
      default:                 return <Badge>{status}</Badge>;
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
                  <Badge variant="outline">{review.reviewCycle?.type}</Badge>
                  {getStatusBadge(review.status)}
                </div>
                <CardTitle className="text-lg">{review.reviewCycle?.title}</CardTitle>
                <CardDescription className="flex items-center mt-2">
                  <Calendar className="mr-1 h-3 w-3" />
                  {review.reviewCycle?.startDate && format(new Date(review.reviewCycle.startDate), 'MMM d')}
                  {' - '}
                  {review.reviewCycle?.endDate && format(new Date(review.reviewCycle.endDate), 'MMM d, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 pb-4">
                <div className="text-sm space-y-3">
                  {review.selfRating && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground">Self Rating</span>
                      <span className="font-medium">{review.selfRating} / 5</span>
                    </div>
                  )}

                  {review.reviewCycle?.is360Degree && (
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground flex items-center"><Users className="mr-2 h-4 w-4" /> Peer Feedback</span>
                      <span className="font-medium">{review.feedbacks?.length || 0} submitted</span>
                    </div>
                  )}

                  {review.status === 'COMPLETED' && (
                    <div className="pt-2">
                      <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">Final Rating</span>
                      <div className="text-xl font-bold">{review.finalRating ?? review.managerRating} <span className="text-sm font-normal text-muted-foreground">/ 5</span></div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-0 border-t mt-auto px-6 py-4 bg-muted/20">
                <Button variant={review.status === 'SELF_EVALUATION' ? 'default' : 'outline'} className="w-full" asChild>
                  <Link to={review.id}>
                    {review.status === 'SELF_EVALUATION' ? 'Start Self-Assessment' : 'View Details'}
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

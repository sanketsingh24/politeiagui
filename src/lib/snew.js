import get from "lodash/fp/get";
import map from "lodash/fp/map";
import reduce from "lodash/fp/reduce";
import compose from "lodash/fp/compose";
import { TOP_LEVEL_COMMENT_PARENTID } from "./api";

export const proposalToT3 = ({
  name, timestamp, status, censorshiprecord = {}
}, idx) => ({
  kind: "t3",
  data: {
    rank: idx + 1,
    title: name || "(Proposal name hidden)",
    id: censorshiprecord.token,
    name: "t3_"+censorshiprecord.token,
    review_status: status,
    created_utc: timestamp,
    permalink: `/proposals/${censorshiprecord.token}/`,
    url: `/proposals/${censorshiprecord.token}/`,
    is_self: true
  }
});

const getChildComments = ({ tree, comments }, parentid) => map(
  compose(
    data => ({
      kind: "t1",
      data: {
        ...data,
        replies: {
          data: {
            children: (data.id && getChildComments({ tree, comments }, data.id)) || []
          }
        }
      }
    }),
    id => comments[id]
  ),
  get(parentid || TOP_LEVEL_COMMENT_PARENTID, tree) || []
);

export const commentsToT1 = compose(
  getChildComments,
  reduce(
    (r, { commentid, userid, parentid, token, comment, timestamp }) => ({
      ...r,
      comments: {
        ...r.comments,
        [commentid]: {
          id: commentid,
          author: userid,
          parent_id: parentid || TOP_LEVEL_COMMENT_PARENTID,
          name: commentid,
          body: comment,
          created_utc: timestamp,
          permalink: `/proposals/${token}/comments/${commentid}`
        }
      },
      tree: {
        ...r.tree,
        [parentid || TOP_LEVEL_COMMENT_PARENTID]: [
          ...(get(["tree", parentid || TOP_LEVEL_COMMENT_PARENTID], r) || []),
          commentid
        ]
      }
    }),
    { tree: {}, comments: {} }
  )
);

import { useChild, useExact } from "@wugui/router";
import LocalCount from "components/LocalCount";
import React, { ReactElement } from "react";

export default function UI(props: any): ReactElement<void> {
  const exact = useExact(props);
  const MatchedChild = useChild(props);

  // 如果当前路由指向子孙，则只显示子孙
  return exact ? (
    <LocalCount title={props.title} />
  ) : <MatchedChild />;
}

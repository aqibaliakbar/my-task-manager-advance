import { supabase } from "@/lib/supabase";
import { createApi } from "@reduxjs/toolkit/query/react";

import { HYDRATE } from "next-redux-wrapper";

const supabaseBaseQuery = async ({ url, method, body, match }) => {
  try {
    let result;
    switch (method) {
      case "SELECT":
        result = await supabase
          .from(url)
          .select(body)
          .match(match || {});
        break;
      case "INSERT":
        result = await supabase.from(url).insert(body).select();
        break;
      case "UPDATE":
        result = await supabase
          .from(url)
          .update(body)
          .match(match || {})
          .select();
        break;
      case "DELETE":
        result = await supabase
          .from(url)
          .delete()
          .match(match || {});
        break;
      default:
        throw new Error(`Unhandled method ${method}`);
    }

    if (result.error) throw result.error;
    return { data: result.data };
  } catch (error) {
    console.log("supabase error", error);
    return { error };
  }
};

export const api = createApi({
  baseQuery: supabaseBaseQuery,
  extractRehydrationInfo(action, { reducerPath }) {
    if (action.type === HYDRATE) {
      return action.payload[reducerPath];
    }
  },
  tagTypes: ["Projects", "Tasks", "Sections", "Teams", "Users", "TeamMembers"],
  endpoints: (builder) => ({
    // Team endpoints
    getTeams: builder.query({
      query: () => ({
        url: "teams",
        method: "SELECT",
        body: `*,
          team_members!left(
            user_id,
            email,
            users(
              full_name,
              email
            )
          )`,
      }),
      providesTags: ["Teams"],
    }),

    createTeam: builder.mutation({
      query: (team) => ({
        url: "teams",
        method: "INSERT",
        body: team,
      }),
      invalidatesTags: ["Teams"],
    }),

    updateTeam: builder.mutation({
      query: ({ teamId, ...updates }) => ({
        url: "teams",
        method: "UPDATE",
        body: updates,
        match: { id: teamId },
      }),
      invalidatesTags: ["Teams"],
    }),

    deleteTeam: builder.mutation({
      query: (teamId) => ({
        url: "teams",
        method: "DELETE",
        match: { id: teamId },
      }),
      invalidatesTags: ["Teams"],
    }),

    getUsers: builder.query({
      query: () => ({
        url: "users",
        method: "SELECT",
        select: "*",
      }),
      providesTags: ["Users"],
    }),

    // Get specific user
    getUser: builder.query({
      query: (userId) => ({
        url: "users",
        method: "SELECT",
        select: "*",
        match: { id: userId },
        single: true,
      }),
      providesTags: (result, error, id) => [{ type: "Users", id }],
    }),

    // Project endpoints
    getProjects: builder.query({
      query: () => ({
        url: "projects",
        method: "SELECT",
        body: `*,
      teams!inner(
        id,
        name,
        team_members(
          user_id,
          users(
            full_name,
            email
          )
        )
      )`,
      }),
      providesTags: ["Projects"],
    }),

    getProject: builder.query({
      query: (projectId) => ({
        url: "projects",
        method: "SELECT",
        body: `id,
      name,
      team_id,
    
      created_at,
      created_by,
      teams (
        id,
        name,
        team_members (
          user_id,
          email,
          users (
            full_name,
            email
          )
        )
      )`,
        match: { id: projectId },
      }),
      transformResponse: (response) => response?.[0],
    }),

    createProject: builder.mutation({
      query: (project) => ({
        url: "projects",
        method: "INSERT",
        body: project,
      }),
      invalidatesTags: ["Projects", "Sections"],
    }),

    updateProject: builder.mutation({
      query: ({ projectId, ...updates }) => ({
        url: "projects",
        method: "UPDATE",
        body: updates,
        match: { id: projectId },
      }),
      invalidatesTags: (result, error, { projectId }) => [
        { type: "Projects", id: projectId },
      ],
    }),

    deleteProject: builder.mutation({
      query: (projectId) => ({
        url: "projects",
        method: "DELETE",
        match: { id: projectId },
      }),
      invalidatesTags: ["Projects"],
    }),

    // Section endpoints
    getSections: builder.query({
      query: (projectId) => ({
        url: "sections",
        method: "SELECT",
        body: `id,
      name,
      project_id,
      created_at`,
        match: { project_id: projectId },
      }),
      providesTags: (result, error, projectId) => [
        { type: "Sections", id: projectId },
        "Sections",
      ],
    }),

    moveTask: builder.mutation({
      query: ({ taskId, sectionId }) => ({
        url: "tasks",
        method: "UPDATE",
        body: { section_id: sectionId },
        match: { id: taskId },
      }),

      async onQueryStarted(
        { taskId, sectionId, project_id },
        { dispatch, queryFulfilled }
      ) {
        const patchResult = dispatch(
          api.util.updateQueryData("getProjectTasks", project_id, (draft) => {
            const task = draft.find((t) => t.id === taskId);
            if (task) {
              task.section_id = sectionId;
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: (result, error, { project_id }) => [
        { type: "Tasks", id: `PROJECT/${project_id}` },
      ],
    }),
    createSection: builder.mutation({
      query: (sections) => {
        console.log("createSection mutation called with:", sections);
        return {
          url: "sections",
          method: "INSERT",
          body: Array.isArray(sections) ? sections : [sections],
        };
      },

      transformResponse: (response, meta, arg) => {
        console.log("createSection response:", response);
        return response;
      },
      invalidatesTags: (result, error, sections) => {
        const projectId = Array.isArray(sections)
          ? sections[0].project_id
          : sections.project_id;
        console.log("Invalidating tags for project:", projectId);
        return [{ type: "Sections", id: projectId }, "Sections"];
      },
    }),

    updateSection: builder.mutation({
      query: ({ sectionId, position, project_id }) => ({
        url: "sections",
        method: "UPDATE",
        body: { position },
        match: { id: sectionId },
      }),
      async onQueryStarted(
        { sectionId, position, project_id },
        { dispatch, queryFulfilled }
      ) {
        const patchResult = dispatch(
          api.util.updateQueryData("getSections", project_id, (draft) => {
            const section = draft.find((s) => s.id === sectionId);
            if (section) {
              section.position = position;
            }
            draft.sort((a, b) => a.position - b.position);
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: (result, error, { project_id }) => [
        { type: "Sections", id: project_id },
      ],
    }),
    deleteSection: builder.mutation({
      query: (sectionId) => ({
        url: "sections",
        method: "DELETE",
        match: { id: sectionId },
      }),
      invalidatesTags: ["Sections"],
    }),

    // Task endpoints
    getTasks: builder.query({
      query: () => ({
        url: "tasks",
        method: "SELECT",
        body: `*,
      sections!left(
        id,
        name
      ),
      users:assigned_to(
        id,
        full_name,
        email
      ),
      projects:project_id(
        id,
        name,
        teams(
          id,
          name
        )
      )`,
      }),
      providesTags: ["Tasks"],
    }),
    getProjectTasks: builder.query({
      query: (projectId) => ({
        url: "tasks",
        method: "SELECT",
        body: `
      id,
      description,
      section_id,
      project_id,
      assigned_to,
      priority,
      due_date,
      created_at,
      created_by,
      is_subtask,
      parent_task_id,
      completed,
      users:assigned_to(
        id,
        email,
        full_name
      ),
      subtasks:tasks!parent_task_id(
        id,
        description,
        completed,
        priority,
        created_at,
        created_by
      )
    `,
        match: { project_id: projectId },
      }),
      providesTags: (result, error, projectId) => [
        { type: "Tasks", id: `PROJECT/${projectId}` },
        "Tasks",
      ],
    }),
    createTask: builder.mutation({
      query: (task) => ({
        url: "tasks",
        method: "INSERT",
        body: task,
      }),
      invalidatesTags: (result, error, { project_id }) => [
        { type: "Tasks", id: `PROJECT/${project_id}` },
        "Tasks",
      ],
    }),

    updateTask: builder.mutation({
      query: ({ taskId, ...updates }) => ({
        url: "tasks",
        method: "UPDATE",
        body: updates,
        match: { id: taskId },
      }),
      invalidatesTags: (result, error, { project_id }) => [
        { type: "Tasks", id: `PROJECT/${project_id}` },
        "Tasks",
      ],
    }),

    deleteTask: builder.mutation({
      query: ({ taskId }) => ({
        url: "tasks",
        method: "DELETE",
        match: { id: taskId },
      }),
      async onQueryStarted(
        { taskId, project_id },
        { dispatch, queryFulfilled }
      ) {
        try {
          const patchResult = dispatch(
            api.util.updateQueryData("getProjectTasks", project_id, (draft) => {
              return draft.filter((task) => task.id !== taskId);
            })
          );
          await queryFulfilled;
        } catch (error) {
          console.log(error);
        }
      },
      invalidatesTags: (result, error, { project_id }) => [
        { type: "Tasks", id: `PROJECT/${project_id}` },
      ],
    }),

    // Team members endpoints
    getTeamMembers: builder.query({
      query: (teamId) => ({
        url: "team_members",
        method: "SELECT",
        body: `
      id,
      team_id,
      user_id,
      email,
      created_at,
      users (
        id,
        email,
        full_name
      )
    `,
        match: { team_id: teamId },
      }),
    }),

    addTeamMember: builder.mutation({
      query: (member) => ({
        url: "team_members",
        method: "INSERT",
        body: {
          team_id: member.team_id,
          email: member.email,
          created_at: new Date().toISOString(),
        },
      }),
      invalidatesTags: (result, error, { team_id }) => [
        { type: "TeamMembers", id: team_id },
        "Teams",
      ],
    }),

    removeTeamMember: builder.mutation({
      query: ({ teamId, userId }) => ({
        url: "team_members",
        method: "DELETE",
        match: { team_id: teamId, user_id: userId },
      }),
      invalidatesTags: (result, error, { teamId }) => [
        { type: "TeamMembers", id: teamId },
        "Teams",
      ],
    }),
  }),
});

export const {
  // Team hooks
  useGetTeamsQuery,
  useCreateTeamMutation,
  useUpdateTeamMutation,
  useDeleteTeamMutation,

  // Project hooks
  useGetProjectsQuery,
  useGetProjectQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,

  // Section hooks
  useGetSectionsQuery,
  useCreateSectionMutation,
  useUpdateSectionMutation,
  useDeleteSectionMutation,

  // Task hooks
  useGetTasksQuery,
  useGetProjectTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useMoveTaskMutation,

  // Team member hooks
  useGetTeamMembersQuery,
  useAddTeamMemberMutation,
  useRemoveTeamMemberMutation,
  // user hooks
  useGetUsersQuery,
  useGetUserQuery,
} = api;

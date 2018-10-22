import {
    PrimaryGeneratedColumn,
    Column,
    Entity,
    OneToMany, Tree, TreeChildren, TreeParent
} from 'typeorm';
import { ArticleEntity } from './article.entity';

@Entity('article_classify_table')
@Tree('nested-set')
export class ClassifyEntity {
    /*分类Id*/
    @PrimaryGeneratedColumn()
    id: number;

    /*分类名称*/
    @Column({
        nullable: false,
        length: 120,
    })
    name: string;

    @TreeChildren()
    children: ClassifyEntity[];

    @TreeParent()
    parent: ClassifyEntity;


    // @OneToMany(
    //     type => ArticleEntity,
    //     articleEntity => articleEntity.classify,
    // )
    // articles: ArticleEntity[];
}

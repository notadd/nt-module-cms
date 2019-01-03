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

    @Column({
        comment: '分类别名',
        unique: true
    })
    alias: string;

    @Column({
        comment: '只显示子级分类文章',
        default: false
    })
    onlyChildrenArt: boolean;

    @TreeChildren()
    children: ClassifyEntity[];

    @TreeParent()
    parent: ClassifyEntity;


    @OneToMany(type => ArticleEntity,article => article.classify)
    articles: ArticleEntity[];
}
